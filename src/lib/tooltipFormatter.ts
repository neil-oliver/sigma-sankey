/**
 * Tooltip formatter utilities for ECharts Sankey chart
 */

export interface TooltipParams {
  name?: string;
  value?: number;
  data?: {
    source?: string;
    target?: string;
    value?: number;
    id?: string | number;
  };
  dataType?: 'node' | 'edge';
}

/**
 * Creates an ECharts formatter function from a template string
 * Supports both {variable} and {data.variable} syntax for backward compatibility
 * 
 * Available variables:
 * - {source} or {data.source} - source node name
 * - {target} or {data.target} - target node name  
 * - {value} or {data.value} - link/node value
 * - {id} or {data.id} - link/node ID
 * - {name} - node name (for node tooltips)
 * 
 * @param template - Template string with variable placeholders
 * @returns ECharts formatter function
 */
export function createTooltipFormatter(template: string): (params: TooltipParams) => string {
  return (params: TooltipParams): string => {
    let result = template;
    
    // Handle both node and edge tooltips
    if (params.dataType === 'edge' && params.data) {
      // Edge/link tooltip - has source, target, value, and potentially id
      const source = String(params.data.source || '');
      const target = String(params.data.target || '');
      const value = String(params.data.value || 0);
      const id = String(params.data.id || '');
      
      // Replace template variables - support both {var} and {data.var} syntax
      result = result
        .replace(/\{(data\.)?source\}/g, source)
        .replace(/\{(data\.)?target\}/g, target)
        .replace(/\{(data\.)?value\}/g, value)
        .replace(/\{(data\.)?id\}/g, id);
        
    } else if (params.dataType === 'node') {
      // Node tooltip - has name and value
      const name = String(params.name || '');
      const value = String(params.value || 0);
      
      // For nodes, also support source/target as aliases for name
      result = result
        .replace(/\{(data\.)?name\}/g, name)
        .replace(/\{(data\.)?source\}/g, name)
        .replace(/\{(data\.)?target\}/g, name)
        .replace(/\{(data\.)?value\}/g, value);
    }
    
    // Handle HTML line breaks
    result = result.replace(/<br\s*\/?>/gi, '<br/>');
    
    return result;
  };
}

/**
 * Validates a tooltip template string
 * @param template - Template string to validate
 * @returns Object with validation results
 */
export function validateTooltipTemplate(template: string): {
  isValid: boolean;
  warnings: string[];
  supportedVariables: string[];
} {
  const warnings: string[] = [];
  const supportedVariables = [
    '{source}', '{target}', '{value}', '{id}', '{name}',
    '{data.source}', '{data.target}', '{data.value}', '{data.id}'
  ];
  
  // Find all template variables in the string
  const variablePattern = /\{([^}]+)\}/g;
  const foundVariables: RegExpMatchArray[] = [];
  let match: RegExpMatchArray | null;
  while ((match = variablePattern.exec(template)) !== null) {
    foundVariables.push(match);
  }
  
  // Check for unsupported variables
  for (const match of foundVariables) {
    const variable = match[0]; // Full match like {source}
    const varName = match[1];  // Variable name like 'source'
    
    if (!supportedVariables.includes(variable)) {
      // Check if it's a valid variable without 'data.' prefix
      const withDataPrefix = `{data.${varName}}`;
      if (!supportedVariables.includes(withDataPrefix)) {
        warnings.push(`Unknown variable: ${variable}`);
      }
    }
  }
  
  // Check for deprecated 'data.' prefix usage
  if (template.includes('{data.')) {
    warnings.push('Using {data.variable} syntax is deprecated. Use {variable} instead (e.g., {source} instead of {data.source})');
  }
  
  return {
    isValid: warnings.filter(w => w.includes('Unknown variable')).length === 0,
    warnings,
    supportedVariables: ['{source}', '{target}', '{value}', '{id}', '{name}']
  };
}

/**
 * Migrates old template format to new format (removes 'data.' prefix)
 * @param template - Template string to migrate
 * @returns Migrated template string
 */
export function migrateTooltipTemplate(template: string): string {
  return template
    .replace(/\{data\.source\}/g, '{source}')
    .replace(/\{data\.target\}/g, '{target}')
    .replace(/\{data\.value\}/g, '{value}')
    .replace(/\{data\.id\}/g, '{id}');
}
