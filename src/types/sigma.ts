// Sigma plugin configuration types
export interface SigmaConfig {
  source?: string;
  sourceColumn?: string;
  targetColumn?: string;
  valueColumn?: string;
  config?: string;
  editMode?: boolean;
}

// Sigma data structure - more specific typing
export interface SigmaData {
  [columnName: string]: (string | number | boolean | null)[];
}


// Sankey-specific configuration interfaces
export interface SankeyNodeSettings {
  width: number;
  gap: number;
  alignRight: boolean;
  label: {
    show: boolean;
    position: 'left' | 'right' | 'top' | 'bottom' | 'inside';
    distance: number;
    rotate: number;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    color: string;
  };
  itemStyle: {
    borderWidth: number;
    borderColor: string;
  };
}

export interface SankeyLinkSettings {
  curveness: number;
  colorMode: 'gradient' | 'source' | 'target' | 'none';
  opacity: number;
  lineStyle: {
    color: string;
    width: number;
    opacity: number;
  };
}

export interface SankeyLayoutSettings {
  orient: 'horizontal' | 'vertical';
  nodeAlign: 'left' | 'right' | 'justify';
  iterations: number;
  nodeGap: number;
  levelGap: number;
}

export interface SankeyTooltipSettings {
  show: boolean;
  trigger: 'item' | 'axis';
  formatter: string;
  backgroundColor: string;
  borderColor: string;
  textStyle: {
    color: string;
    fontSize: number;
  };
}

export interface SankeyInteractionSettings {
  emphasis: {
    focus: 'none' | 'self' | 'adjacency';
    blurScope: 'coordinateSystem' | 'series' | 'global';
  };
  select: {
    disabled: boolean;
  };
}


export interface SankeySettings {
  nodes: SankeyNodeSettings;
  links: SankeyLinkSettings;
  layout: SankeyLayoutSettings;
  tooltip: SankeyTooltipSettings;
  interaction: SankeyInteractionSettings;
  animation: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
}

// Plugin settings interface
export interface PluginSettings {
  sankey?: SankeySettings;
}

// Data information interface
export interface DataInfo {
  rowCount: number;
  sourceColumnName: string;
  targetColumnName: string;
  valueColumnName: string;
  hasData: boolean;
}

// ECharts Sankey data structures
export interface SankeyNode {
  id?: string;
  name: string;
  value?: number;
  depth?: number;
}

export interface SankeyLink {
  source: string | number;
  target: string | number;
  value: number;
}

export interface SankeyChartData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Sigma client interface (based on @sigmacomputing/plugin)
export interface SigmaClient {
  config: {
    set: (config: Record<string, unknown>) => void;
    configureEditorPanel: (config: Array<{
      name: string;
      type: string;
      source?: string;
      allowMultiple?: boolean;
      label?: string;
      defaultValue?: string;
    }>) => void;
  };
}

// Settings component props with proper client typing (optional)
export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: PluginSettings;
  onSave: (settings: PluginSettings) => void;
  client: SigmaClient;
}

// Error handling types
export interface ConfigParseError {
  message: string;
  originalError: unknown;
}

// Event handler types (kept for potential use)
export interface ColorChangeEvent {
  target: {
    value: string;
  };
}


