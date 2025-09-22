import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import { SankeyChartData, SankeySettings } from '../types/sigma';
import { DEFAULT_SANKEY_SETTINGS } from '../lib/sankeyDefaults';

interface SankeyChartProps {
  data: SankeyChartData;
  settings: SankeySettings;
  width?: number | string;
  onChartReady?: (chart: ECharts) => void;
  onNodeClick?: (params: any) => void;
  onLinkClick?: (params: any) => void;
}

export interface SankeyChartRef {
  getChartInstance: () => ECharts | null;
}

// Generate colors for nodes to enable gradients
const generateNodeColor = (index: number, total: number): string => {
  // Use a color palette that works well for gradients
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#8d6e5f',
    '#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53'
  ];
  
  if (total <= colors.length) {
    return colors[index];
  }
  
  // For more nodes, generate colors using HSL
  const hue = (index * 360 / total) % 360;
  const saturation = 65 + (index % 3) * 10; // 65%, 75%, 85%
  const lightness = 50 + (index % 2) * 15;  // 50%, 65%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const SankeyChart = forwardRef<SankeyChartRef, SankeyChartProps>(({
  data,
  settings = DEFAULT_SANKEY_SETTINGS,
  width = '100%',
  onChartReady,
  onNodeClick,
  onLinkClick,
}, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef<boolean>(true);

  // Create ECharts option from settings and data - memoized to prevent unnecessary recreations
  const chartOption = useMemo(() => {
    // Only enable animations on the first render, not on subsequent updates
    const shouldAnimate = settings.animation.enabled && isFirstRender.current;
    
    return {
      tooltip: {
        show: settings.tooltip.show,
        trigger: settings.tooltip.trigger,
        formatter: settings.tooltip.formatter,
        backgroundColor: settings.tooltip.backgroundColor,
        borderColor: settings.tooltip.borderColor,
        textStyle: {
          color: settings.tooltip.textStyle.color,
          fontSize: settings.tooltip.textStyle.fontSize,
        },
      },
      animation: shouldAnimate,
      animationDuration: shouldAnimate ? settings.animation.duration : 0,
      animationEasing: settings.animation.easing as any,
      series: [
        {
          type: 'sankey',
          orient: settings.layout.orient,
          data: data.nodes.map((node, index) => ({
            name: node.name,
            value: node.value,
            itemStyle: {
              color: generateNodeColor(index, data.nodes.length),
              borderColor: settings.nodes.itemStyle.borderColor,
              borderWidth: settings.nodes.itemStyle.borderWidth,
            },
            label: {
              show: settings.nodes.label.show,
              position: settings.nodes.label.position,
              distance: settings.nodes.label.distance,
              rotate: settings.nodes.label.rotate,
              fontSize: settings.nodes.label.fontSize,
              fontWeight: settings.nodes.label.fontWeight,
            },
          })),
          links: data.links.map((link) => {
            // For gradient mode, don't set individual link colors - let series lineStyle handle it
            const linkLineStyle: any = {
              width: settings.links.lineStyle.width,
              opacity: settings.links.opacity,
              curveness: settings.links.curveness,
            };
            
            // Only set color for non-gradient modes
            if (settings.links.colorMode !== 'gradient') {
              linkLineStyle.color = settings.links.colorMode === 'source' ? 'source' :
                                   settings.links.colorMode === 'target' ? 'target' :
                                   settings.links.lineStyle.color;
            }
            
            const linkData: any = {
              source: link.source,
              target: link.target,
              value: link.value,
              lineStyle: linkLineStyle,
            };

            // Include ID if available
            if (link.id) {
              linkData.id = link.id;
            }

            return linkData;
          }),
          emphasis: {
            focus: settings.interaction.emphasis.focus,
            blurScope: settings.interaction.emphasis.blurScope,
          },
          select: {
            disabled: settings.interaction.select.disabled,
          },
          nodeWidth: settings.nodes.width,
          nodeAlign: settings.layout.nodeAlign,
          nodeGap: settings.layout.nodeGap,
          iterations: settings.layout.iterations,
          lineStyle: {
            color: settings.links.colorMode === 'gradient' ? 'gradient' : 
                   settings.links.colorMode === 'source' ? 'source' :
                   settings.links.colorMode === 'target' ? 'target' : 
                   settings.links.lineStyle.color,
            curveness: settings.links.curveness,
            opacity: settings.links.opacity,
          },
        },
      ],
    };
  }, [data, settings]);

  // Initialize chart
  const initChart = useCallback(() => {
    if (!chartRef.current) return;

    try {
      setError(null);

      // Dispose existing chart if any
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }

      // Create new chart instance
      chartInstance.current = echarts.init(chartRef.current);

      // Set options using memoized chart option
      chartInstance.current.setOption(chartOption, true); // true = notMerge for complete refresh

      // Add event listeners
      if (onNodeClick) {
        chartInstance.current.on('click', (params: any) => {
          if (params.dataType === 'node') {
            onNodeClick(params);
          }
        });
      }

      if (onLinkClick) {
        chartInstance.current.on('click', (params: any) => {
          if (params.dataType === 'edge') {
            onLinkClick(params);
          }
        });
      }

      // Handle chart ready
      if (onChartReady) {
        onChartReady(chartInstance.current);
      }

      // Mark first render as complete to disable animations on future updates
      isFirstRender.current = false;
    } catch (err) {
      console.error('Error initializing Sankey chart:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize chart');
    }
  }, [chartOption, onNodeClick, onLinkClick, onChartReady]);

  // Update chart when data or settings change
  useEffect(() => {
    if (data.nodes.length > 0 && data.links.length > 0) {
      initChart();
    }
  }, [data, settings, initChart]); // Fixed: include initChart in dependencies for proper updates

  // Calculate height based on settings
  const getChartHeight = useCallback((): string | number => {
    const { heightMode, customHeight } = settings.layout;
    
    switch (heightMode) {
      case 'fixed':
        return `${customHeight}px`;
      case 'responsive':
      default:
        return '100%';
    }
  }, [settings.layout]);

  // Handle resize and responsive height changes
  const handleResize = useCallback(() => {
    if (chartInstance.current) {
      chartInstance.current.resize();
    }
  }, []);

  // Set up resize observer for responsive height
  useEffect(() => {
    if (settings.layout.heightMode === 'responsive' && chartRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        // Debounce resize events to avoid excessive calls
        setTimeout(() => {
          if (chartInstance.current) {
            chartInstance.current.resize();
          }
        }, 50);
      });

      // Observe the chart container itself
      resizeObserver.observe(chartRef.current);
      
      // Also observe the parent container for better responsiveness
      const parentElement = chartRef.current.parentElement;
      if (parentElement) {
        resizeObserver.observe(parentElement);
      }
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [settings.layout.heightMode]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);


  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getChartInstance: () => chartInstance.current,
  }));

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center p-6">
          <div className="text-red-600 text-lg font-medium mb-2">Chart Error</div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={chartRef} 
        style={{ 
          width: width, 
          height: getChartHeight()
        }}
        className="sankey-chart-container"
      />
    </div>
  );
});

SankeyChart.displayName = 'SankeyChart';

export default SankeyChart;
