import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { client, useConfig, useElementData, useElementColumns, useVariable } from '@sigmacomputing/plugin';
import { Button } from './components/ui/button';
import { Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import Settings, { DEFAULT_SETTINGS } from './Settings';
import SankeyChart from './components/SankeyChart';
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
        <div className="text-center max-w-xl">
          <h3 className="text-lg font-semibold mb-2">Sankey Diagram</h3>
          <p className="text-muted-foreground">Please select a data source to get started.</p>
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

    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center max-w-xl">
          <h3 className="text-lg font-semibold mb-2">Data Source Selected</h3>
          <p className="text-muted-foreground">
            Please select the following columns: {missingColumns.join(', ')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Sankey charts require source, target, and value columns to display flow relationships. 
            The ID column is optional but recommended for link selection functionality.
          </p>
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
            <div className="text-center max-w-2xl">
              <div className="mb-6">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Data Validation Errors</h3>
              </div>
              
              {dataValidation.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 text-left space-y-1">
                    {dataValidation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {dataValidation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                  <ul className="text-sm text-yellow-700 text-left space-y-1">
                    {dataValidation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {dataInfo && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                  Data Info: {dataInfo.rowCount} rows from "{dataInfo.sourceColumnName}", 
                  "{dataInfo.targetColumnName}", and "{dataInfo.valueColumnName}"
                </div>
              )}
            </div>
          </div>
        ) : (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) && sigmaData && dataInfo && dataInfo.hasData ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xl">
              <h3 className="text-lg font-semibold mb-4">Sankey Diagram</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-md font-medium mb-2">No Chart Data</h4>
                <p className="text-blue-700">
                  No valid data found to create the Sankey diagram. Please check your data source and column selections.
                </p>
                {dataInfo && (
                  <p className="text-sm text-blue-600 mt-2">
                    Found {dataInfo.rowCount} rows in the selected columns.
                  </p>
                )}
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


