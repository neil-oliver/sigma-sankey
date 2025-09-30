import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { client, useConfig, useElementData, useElementColumns, useVariable } from '@sigmacomputing/plugin';
import { Button } from './components/ui/button';
import { Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import Settings, { DEFAULT_SETTINGS } from './Settings';
import SankeyChart from './components/SankeyChart';
import SankeyIcon from './components/icons/SankeyIcon';
import SankeyFlowIcon from './components/icons/SankeyFlowIcon';
import ErrorBoundary from './components/ErrorBoundary';
import { transformSigmaDataToSankey, validateSankeyData, aggregateLinks } from './lib/sankeyDataTransform';
import { DEFAULT_SANKEY_SETTINGS } from './lib/sankeyDefaults';
import { 
  SigmaConfig, 
  SigmaData, 
  PluginSettings, 
  DataInfo, 
  ConfigParseError,
  SankeyChartData 
} from './types/sigma';
import './App.css';

// Configure the plugin editor panel
client.config.configureEditorPanel([
  { name: 'source', type: 'element' },
  { name: 'sourceColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Source Column' },
  { name: 'targetColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Target Column' },
  { name: 'valueColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Value Column' },
  { name: 'idColumn', type: 'column', source: 'source', allowMultiple: false, label: 'ID Column (Optional)' },
  { name: 'selectedID', type: 'variable', label: 'Selected ID Control' },
  { name: 'config', type: 'text', label: 'Settings Config (JSON)', defaultValue: "{}" },
  { name: 'editMode', type: 'toggle', label: 'Edit Mode' }
]);

const App: React.FC = (): React.JSX.Element => {
  const config: SigmaConfig = useConfig();
  const sigmaData: SigmaData = useElementData(config.source || '');
  const columns = useElementColumns(config.source || '');
  const [, setSelectedID] = useVariable(config.selectedID!);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<PluginSettings>(DEFAULT_SETTINGS);

  // Parse config JSON and load settings
  useEffect(() => {
    if (config.config?.trim()) {
      try {
        const parsedConfig = JSON.parse(config.config) as Partial<PluginSettings>;
        const newSettings: PluginSettings = { ...DEFAULT_SETTINGS, ...parsedConfig };
        setSettings(newSettings);
      } catch (err) {
        const error: ConfigParseError = {
          message: 'Invalid config JSON',
          originalError: err
        };
        console.error('Config parse error:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [config.config]);


  const handleSettingsSave = useCallback((newSettings: PluginSettings): void => {
    setSettings(newSettings);
    setShowSettings(false);
  }, []);

  const handleShowSettings = useCallback((): void => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback((): void => {
    setShowSettings(false);
  }, []);



  // Keyboard shortcuts for enhanced interactivity
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts in edit mode and when settings modal is closed
      if (!config.editMode || showSettings) return;
      
      // Ctrl/Cmd + , for settings
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        handleShowSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.editMode, showSettings, handleShowSettings]);

  // Transform Sigma data to Sankey format with performance optimization
  const sankeyData: SankeyChartData = useMemo(() => {
    if (!sigmaData || !config.sourceColumn || !config.targetColumn || !config.valueColumn) {
      return { nodes: [], links: [] };
    }

    try {
      const rawData = transformSigmaDataToSankey(
        sigmaData, 
        config.sourceColumn, 
        config.targetColumn, 
        config.valueColumn,
        config.idColumn
      );

      // Aggregate duplicate links
      const aggregatedLinks = aggregateLinks(rawData.links);
      
      return {
        nodes: rawData.nodes,
        links: aggregatedLinks
      };
    } catch (error) {
      console.error('Error processing Sankey data:', error);
      return { nodes: [], links: [] };
    }
  }, [sigmaData, config.sourceColumn, config.targetColumn, config.valueColumn, config.idColumn]);

  // Validate Sankey data - but only when we have attempted to load data
  const dataValidation = useMemo(() => {
    // Don't run validation if we have no config yet
    if (!config.sourceColumn || !config.targetColumn || !config.valueColumn) {
      return { isValid: true, errors: [], warnings: [] };
    }
    
    // Don't show validation errors for initial empty state - only after we've tried to transform data
    if (sankeyData.nodes.length === 0 && sankeyData.links.length === 0 && sigmaData) {
      // Check if we have source data but it resulted in empty sankeyData - this indicates a real validation issue
      const sourceData = sigmaData[config.sourceColumn] || [];
      if (sourceData.length > 0) {
        // We have source data but got empty result - run validation to show what went wrong
        return validateSankeyData(sankeyData);
      }
      // No source data yet or empty source data - don't show validation errors
      return { isValid: true, errors: [], warnings: [] };
    }
    
    return validateSankeyData(sankeyData);
  }, [sankeyData, config.sourceColumn, config.targetColumn, config.valueColumn, sigmaData]);

  // Get data information
  const getDataInfo = useCallback((): DataInfo | null => {
    if (!sigmaData || !config.sourceColumn || !config.targetColumn || !config.valueColumn) {
      return null;
    }

    const sourceColumnData = sigmaData[config.sourceColumn];
    const targetColumnData = sigmaData[config.targetColumn];
    const valueColumnData = sigmaData[config.valueColumn];
    
    if (!sourceColumnData || !targetColumnData || !valueColumnData) {
      return null;
    }

    // Get column names from columns object using the column IDs
    const sourceColumnInfo = columns[config.sourceColumn];
    const targetColumnInfo = columns[config.targetColumn];
    const valueColumnInfo = columns[config.valueColumn];

    const sourceColumnName = sourceColumnInfo?.name || config.sourceColumn;
    const targetColumnName = targetColumnInfo?.name || config.targetColumn;
    const valueColumnName = valueColumnInfo?.name || config.valueColumn;

    return {
      rowCount: sourceColumnData.length,
      sourceColumnName: sourceColumnName,
      targetColumnName: targetColumnName,
      valueColumnName: valueColumnName,
      hasData: sourceColumnData.length > 0 && targetColumnData.length > 0 && valueColumnData.length > 0
    };
  }, [sigmaData, config.sourceColumn, config.targetColumn, config.valueColumn, columns]);

  const dataInfo = getDataInfo();

  // Early return for missing source
  if (!config.source) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center max-w-4xl">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <SankeyIcon className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Sigma Sankey Diagram Plugin</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Create beautiful flow diagrams to visualize relationships and quantities between different categories
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-card border rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-sm font-bold">1</span>
                Connect Your Data
              </h3>
              <p className="text-muted-foreground mb-4">Select a data source from your Sigma workbook that contains flow relationships.</p>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2"><strong>What you'll need:</strong></p>
                <ul className="space-y-1">
                  <li>• Source column (where flows originate)</li>
                  <li>• Target column (where flows end)</li>
                  <li>• Value column (flow quantities)</li>
                  <li>• ID column (optional, for filtering)</li>
                </ul>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-sm font-bold">2</span>
                Visualize Flows
              </h3>
              <p className="text-muted-foreground mb-4">Watch your data transform into an interactive Sankey diagram.</p>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2"><strong>Perfect for:</strong></p>
                <ul className="space-y-1">
                  <li>• Customer journey analysis</li>
                  <li>• Budget allocation flows</li>
                  <li>• Process optimization</li>
                  <li>• Supply chain visualization</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <SankeyFlowIcon className="text-blue-600" size={20} />
              Example Data Format
            </h4>
            <div className="bg-white border border-blue-200 rounded-lg p-4 font-mono text-sm">
              <div className="grid grid-cols-3 gap-4 text-blue-700">
                <div><strong>Source</strong></div>
                <div><strong>Target</strong></div>
                <div><strong>Value</strong></div>
              </div>
              <div className="mt-2 space-y-1 text-gray-600">
                <div className="grid grid-cols-3 gap-4">
                  <div>Marketing</div>
                  <div>Leads</div>
                  <div>1000</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>Leads</div>
                  <div>Qualified</div>
                  <div>250</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>Qualified</div>
                  <div>Sales</div>
                  <div>75</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium mb-2">Ready to get started?</p>
            <p className="text-muted-foreground mb-4">Select a data source from the configuration panel to begin</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Look for the configuration panel on the right side
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Early return for missing columns
  if (!config.sourceColumn || !config.targetColumn || !config.valueColumn) {
    const missingColumns = [];
    if (!config.sourceColumn) missingColumns.push('Source Column');
    if (!config.targetColumn) missingColumns.push('Target Column');
    if (!config.valueColumn) missingColumns.push('Value Column');

    const selectedColumns = [];
    if (config.sourceColumn) selectedColumns.push('Source Column ✓');
    if (config.targetColumn) selectedColumns.push('Target Column ✓');
    if (config.valueColumn) selectedColumns.push('Value Column ✓');

    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center max-w-4xl">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <SankeyIcon className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Configure Your Data Columns</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Great! Your data source is connected. Now let's map your columns to create the Sankey diagram.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                    {selectedColumns.length}
                  </span>
                  Configuration Progress
                </h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'Source Column', key: 'sourceColumn', required: true },
                    { name: 'Target Column', key: 'targetColumn', required: true },
                    { name: 'Value Column', key: 'valueColumn', required: true },
                    { name: 'ID Column', key: 'idColumn', required: false }
                  ].map((column) => {
                    const isSelected = config[column.key as keyof typeof config];
                    return (
                      <div key={column.key} className={`flex items-center gap-3 p-3 rounded-lg border ${isSelected ? 'bg-green-50 border-green-200' : column.required ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        {isSelected ? (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 ${column.required ? 'border-orange-400' : 'border-gray-300'}`} />
                        )}
                        <div className="flex-1">
                          <span className={`font-medium ${isSelected ? 'text-green-700' : column.required ? 'text-orange-700' : 'text-gray-600'}`}>
                            {column.name}
                            {column.required && !isSelected && <span className="text-red-500 ml-1">*</span>}
                          </span>
                          {!column.required && <span className="text-xs text-gray-500 ml-2">(Optional)</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {missingColumns.length > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700 font-medium">
                      Still needed: {missingColumns.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6 text-left">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <SankeyFlowIcon className="text-blue-600" size={20} />
                  Column Mapping Guide
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-blue-700 mb-1">Source Column <span className="text-red-500">*</span></h5>
                    <p className="text-sm text-muted-foreground">The starting point of each flow (e.g., "Marketing", "Department", "Category")</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-green-700 mb-1">Target Column <span className="text-red-500">*</span></h5>
                    <p className="text-sm text-muted-foreground">The destination of each flow (e.g., "Leads", "Budget", "Subcategory")</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-purple-700 mb-1">Value Column <span className="text-red-500">*</span></h5>
                    <p className="text-sm text-muted-foreground">The quantity or amount flowing (e.g., "Amount", "Count", "Budget")</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">ID Column</h5>
                    <p className="text-sm text-muted-foreground">Unique identifier for filtering and interaction (optional)</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-800 mb-3">💡 Quick Tips</h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• Each row represents one flow from source to target</li>
                  <li>• Values will be aggregated if you have duplicate flows</li>
                  <li>• Negative values will be treated as zero</li>
                  <li>• Missing values in required columns will be filtered out</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l2-2m0 0l2-2m-2 2l-2-2m2 2v6" />
              </svg>
              Select columns in the configuration panel to continue
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header Controls */}
      <div className="absolute top-5 right-5 z-20 flex gap-2">
        {config.editMode && (
          <Button 
            className="gap-2"
            onClick={handleShowSettings}
            size="sm"
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Button>
        )}
      </div>
      
      {/* Main Content */}
      <div className="w-full h-screen p-5 box-border">
        {!dataValidation.isValid ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-3xl">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <div className="relative">
                    <SankeyIcon className="text-white opacity-40" size={32} />
                    <AlertCircle className="h-6 w-6 text-white absolute -top-1 -right-1" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Data Validation Issues</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  We found some issues with your data that need to be resolved before creating the Sankey diagram.
                </p>
              </div>
              
              <div className="grid md:grid-cols-1 gap-6 mb-8">
              {dataValidation.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-red-800">Critical Issues</h4>
                    </div>
                    <ul className="space-y-2">
                    {dataValidation.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                          <span className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{error}</span>
                        </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {dataValidation.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-left">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-yellow-800">Warnings</h4>
                    </div>
                    <ul className="space-y-2">
                    {dataValidation.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-yellow-700">
                          <span className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{warning}</span>
                        </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <SankeyFlowIcon className="text-blue-600" size={20} />
                  Common Solutions
                </h4>
                <ul className="text-sm text-blue-700 space-y-2 text-left">
                  <li>• Check for missing or null values in your required columns</li>
                  <li>• Ensure your value column contains numeric data</li>
                  <li>• Verify that source and target columns have matching values across rows</li>
                  <li>• Remove any circular references (source = target)</li>
                </ul>
              </div>
              
              {dataInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                  <strong>Data Summary:</strong> {dataInfo.rowCount} rows from "{dataInfo.sourceColumnName}", 
                  "{dataInfo.targetColumnName}", and "{dataInfo.valueColumnName}"
                </div>
              )}
            </div>
          </div>
        ) : (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) && sigmaData && dataInfo && dataInfo.hasData ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-2xl">
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <div className="relative">
                    <SankeyIcon className="text-white opacity-50" size={32} />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-4">No Flowable Data Found</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Your data is connected, but we couldn't create any flow relationships for the Sankey diagram.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-blue-800 mb-3">Possible Reasons:</h4>
                <ul className="text-sm text-blue-700 space-y-2 text-left">
                  <li>• All values in your value column might be zero or negative</li>
                  <li>• Source and target columns might have no matching relationships</li>
                  <li>• Data might be filtered out due to missing values</li>
                  <li>• Column selections might not match your intended data structure</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Data Summary</h4>
                {dataInfo && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Rows:</strong> {dataInfo.rowCount}</p>
                    <p><strong>Columns:</strong> {dataInfo.sourceColumnName} → {dataInfo.targetColumnName} (values: {dataInfo.valueColumnName})</p>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-muted-foreground">Try adjusting your column selections or checking your data source.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <ErrorBoundary>
              <SankeyChart
                data={sankeyData}
                settings={settings.sankey || DEFAULT_SANKEY_SETTINGS}
                width="100%"
                onNodeClick={(params) => {
                  console.log('Node clicked:', params);
                  // Could be extended to show detailed node information
                  // or trigger additional actions based on the node data
                }}
                onLinkClick={(params) => {
                  console.log('Link clicked:', params);
                  // Set the selected ID variable if we have an ID and the link has an ID
                  if (setSelectedID && params?.data?.id) {
                    setSelectedID(params.data.id);
                  }
                  // Could be extended to show detailed link information
                  // or trigger filtering/highlighting actions
                }}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>

      <Settings
        isOpen={showSettings}
        onClose={handleCloseSettings}
        currentSettings={settings}
        onSave={handleSettingsSave}
        client={client}
      />
    </div>
  );
};

export default App;


