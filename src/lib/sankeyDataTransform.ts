import { SigmaData, SankeyChartData, SankeyNode, SankeyLink } from '../types/sigma';

/**
 * Transform Sigma data into ECharts Sankey format
 * @param sigmaData - Raw data from Sigma
 * @param sourceColumn - Column name for source nodes
 * @param targetColumn - Column name for target nodes  
 * @param valueColumn - Column name for flow values
 * @returns Formatted data for ECharts Sankey chart
 */
export function transformSigmaDataToSankey(
  sigmaData: SigmaData,
  sourceColumn: string,
  targetColumn: string,
  valueColumn: string
): SankeyChartData {
  if (!sigmaData || !sourceColumn || !targetColumn || !valueColumn) {
    return { nodes: [], links: [] };
  }

  const sourceData = sigmaData[sourceColumn] || [];
  const targetData = sigmaData[targetColumn] || [];
  const valueData = sigmaData[valueColumn] || [];

  if (sourceData.length !== targetData.length || sourceData.length !== valueData.length) {
    console.error('Sankey data columns must have equal length');
    return { nodes: [], links: [] };
  }

  // Track unique nodes - let ECharts handle all sizing calculations
  const nodeNames = new Set<string>();
  const links: SankeyLink[] = [];

  // Process each data row
  for (let i = 0; i < sourceData.length; i++) {
    const source = String(sourceData[i] || '').trim();
    const target = String(targetData[i] || '').trim();
    const value = Number(valueData[i]) || 0;

    // Skip invalid rows
    if (!source || !target || value <= 0) {
      continue;
    }

    // Track unique node names
    nodeNames.add(source);
    nodeNames.add(target);

    // Add link
    links.push({
      source: source,
      target: target,
      value: value
    });
  }

  // Convert node names to node objects - let ECharts calculate node values automatically from links
  const nodes: SankeyNode[] = Array.from(nodeNames).map(nodeName => ({
    name: nodeName
  }));

  // Debug logging
  if (nodes.length > 0) {
    console.log(`Sankey transformation complete: ${nodes.length} nodes, ${links.length} links`);
    console.log('Nodes:', nodes.map(n => n.name).join(', '));
  }

  return { nodes, links };
}

/**
 * Aggregate duplicate links by summing their values
 * @param links - Array of Sankey links
 * @returns Aggregated links with combined values
 */
export function aggregateLinks(links: SankeyLink[]): SankeyLink[] {
  const linkMap = new Map<string, SankeyLink>();

  links.forEach(link => {
    const key = `${link.source}->${link.target}`;
    
    if (linkMap.has(key)) {
      linkMap.get(key)!.value += link.value;
    } else {
      linkMap.set(key, { ...link });
    }
  });

  return Array.from(linkMap.values());
}

/**
 * Calculate node positions and depths for better layout
 * @param nodes - Array of Sankey nodes
 * @param links - Array of Sankey links
 * @returns Updated nodes with calculated depths
 */
export function calculateNodeDepths(
  nodes: SankeyNode[], 
  links: SankeyLink[]
): SankeyNode[] {
  const nodeMap = new Map(nodes.map(node => [node.name, { ...node, depth: 0 }]));
  const visited = new Set<string>();
  const inDegree = new Map<string, number>();
  
  // Initialize in-degree count
  nodes.forEach(node => inDegree.set(node.name, 0));
  
  // Calculate in-degrees
  links.forEach(link => {
    const targetName = String(link.target);
    inDegree.set(targetName, (inDegree.get(targetName) || 0) + 1);
  });
  
  // Find starting nodes (nodes with no incoming edges)
  const queue: string[] = [];
  inDegree.forEach((degree, nodeName) => {
    if (degree === 0) {
      queue.push(nodeName);
    }
  });
  
  let currentDepth = 0;
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    
    // Process all nodes at current depth
    for (let i = 0; i < levelSize; i++) {
      const nodeName = queue.shift()!;
      const node = nodeMap.get(nodeName);
      
      if (node && !visited.has(nodeName)) {
        node.depth = currentDepth;
        visited.add(nodeName);
        
        // Find outgoing links and reduce in-degree of targets
        links.forEach(link => {
          if (String(link.source) === nodeName) {
            const targetName = String(link.target);
            const newInDegree = (inDegree.get(targetName) || 0) - 1;
            inDegree.set(targetName, newInDegree);
            
            if (newInDegree === 0 && !visited.has(targetName)) {
              queue.push(targetName);
            }
          }
        });
      }
    }
    
    currentDepth++;
  }
  
  return Array.from(nodeMap.values());
}

/**
 * Validate Sankey data for common issues
 * @param data - Sankey chart data to validate
 * @returns Object with validation results and error messages
 */
export function validateSankeyData(data: SankeyChartData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if data exists
  if (!data.nodes || !data.links) {
    errors.push('Missing nodes or links data');
    return { isValid: false, errors, warnings };
  }
  
  // Check for empty data
  if (data.nodes.length === 0) {
    errors.push('No nodes found in data');
  }
  
  if (data.links.length === 0) {
    errors.push('No links found in data');
  }
  
  // Check for orphaned nodes
  const nodeNames = new Set(data.nodes.map(node => node.name));
  const linkNodes = new Set<string>();
  
  data.links.forEach(link => {
    linkNodes.add(String(link.source));
    linkNodes.add(String(link.target));
  });
  
  const orphanedNodes = data.nodes.filter(node => !linkNodes.has(node.name));
  if (orphanedNodes.length > 0) {
    warnings.push(`Found ${orphanedNodes.length} orphaned nodes (nodes not connected to any links)`);
  }
  
  // Check for invalid link references
  const invalidLinks = data.links.filter(link => 
    !nodeNames.has(String(link.source)) || !nodeNames.has(String(link.target))
  );
  
  if (invalidLinks.length > 0) {
    errors.push(`Found ${invalidLinks.length} links referencing non-existent nodes`);
  }
  
  // Check for self-referencing links
  const selfLinks = data.links.filter(link => link.source === link.target);
  if (selfLinks.length > 0) {
    warnings.push(`Found ${selfLinks.length} self-referencing links`);
  }
  
  // Check for negative values
  const negativeValueLinks = data.links.filter(link => link.value <= 0);
  if (negativeValueLinks.length > 0) {
    errors.push(`Found ${negativeValueLinks.length} links with zero or negative values`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
