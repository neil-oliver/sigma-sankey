import type { SankeySettings } from '../types/sigma';

// Default Sankey settings for the plugin
export const DEFAULT_SANKEY_SETTINGS: SankeySettings = {
  nodes: {
    width: 20,
    gap: 8,
    alignRight: false,
    label: {
      show: true,
      position: 'right',
      distance: 5,
      rotate: 0,
      fontSize: 12,
      fontWeight: 'normal',
      color: '#333333',
    },
    itemStyle: {
      borderWidth: 1,
      borderColor: '#ffffff',
    },
  },
  links: {
    curveness: 0.5,
    colorMode: 'gradient',
    opacity: 0.7,
    lineStyle: {
      color: '#cccccc',
      width: 1,
      opacity: 0.7,
    },
  },
  layout: {
    orient: 'horizontal',
    nodeAlign: 'left',
    iterations: 32,
    nodeGap: 8,
    levelGap: 20,
  },
  tooltip: {
    show: true,
    trigger: 'item',
    formatter: '{b} : {c}',
    backgroundColor: 'rgba(50,50,50,0.7)',
    borderColor: '#333',
    textStyle: {
      color: '#fff',
      fontSize: 12,
    },
  },
  interaction: {
    emphasis: {
      focus: 'adjacency',
      blurScope: 'coordinateSystem',
    },
    select: {
      disabled: false,
    },
  },
  animation: {
    enabled: true,
    duration: 1000,
    easing: 'cubicOut',
  },
};
