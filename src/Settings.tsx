import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { PluginSettings } from './types/sigma';
import { DEFAULT_SANKEY_SETTINGS } from './lib/sankeyDefaults';


export const DEFAULT_SETTINGS: PluginSettings = {
  sankey: { ...DEFAULT_SANKEY_SETTINGS },
};

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: PluginSettings;
  onSave: (settings: PluginSettings) => void;
  client: any; // Keep any for simplicity in template
}

const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSave, 
  client 
}) => {
  const [tempSettings, setTempSettings] = useState<PluginSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'nodes' | 'links' | 'layout' | 'interaction'>('nodes');

  // Update temp settings when current settings change
  useEffect(() => {
    const settingsWithDefaults: PluginSettings = {
      ...DEFAULT_SETTINGS,
      ...currentSettings,
      sankey: {
        ...DEFAULT_SETTINGS.sankey!,
        ...(currentSettings.sankey || {}),
        nodes: {
          ...DEFAULT_SETTINGS.sankey!.nodes,
          ...(currentSettings.sankey?.nodes || {}),
        },
        links: {
          ...DEFAULT_SETTINGS.sankey!.links,
          ...(currentSettings.sankey?.links || {}),
        },
        layout: {
          ...DEFAULT_SETTINGS.sankey!.layout,
          ...(currentSettings.sankey?.layout || {}),
        },
        tooltip: {
          ...DEFAULT_SETTINGS.sankey!.tooltip,
          ...(currentSettings.sankey?.tooltip || {}),
        },
        interaction: {
          ...DEFAULT_SETTINGS.sankey!.interaction,
          ...(currentSettings.sankey?.interaction || {}),
        },
        animation: {
          ...DEFAULT_SETTINGS.sankey!.animation,
          ...(currentSettings.sankey?.animation || {}),
        },
      },
    };
    setTempSettings(settingsWithDefaults);
  }, [currentSettings]);

  // Validate settings before saving
  const validateSettings = (settings: PluginSettings): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validate node settings
    if (settings.sankey?.nodes.width && (settings.sankey.nodes.width < 5 || settings.sankey.nodes.width > 100)) {
      errors.push('Node width must be between 5 and 100');
    }
    if (settings.sankey?.nodes.label.fontSize && (settings.sankey.nodes.label.fontSize < 8 || settings.sankey.nodes.label.fontSize > 24)) {
      errors.push('Label font size must be between 8 and 24');
    }
    
    // Validate link settings
    if (settings.sankey?.links.curveness && (settings.sankey.links.curveness < 0 || settings.sankey.links.curveness > 1)) {
      errors.push('Link curveness must be between 0 and 1');
    }
    if (settings.sankey?.links.opacity && (settings.sankey.links.opacity < 0 || settings.sankey.links.opacity > 1)) {
      errors.push('Link opacity must be between 0 and 1');
    }
    
    // Validate layout settings
    if (settings.sankey?.layout.nodeGap && (settings.sankey.layout.nodeGap < 0 || settings.sankey.layout.nodeGap > 50)) {
      errors.push('Node gap must be between 0 and 50');
    }
    if (settings.sankey?.layout.levelGap && (settings.sankey.layout.levelGap < 10 || settings.sankey.layout.levelGap > 200)) {
      errors.push('Level gap must be between 10 and 200');
    }
    if (settings.sankey?.layout.iterations && (settings.sankey.layout.iterations < 1 || settings.sankey.layout.iterations > 100)) {
      errors.push('Layout iterations must be between 1 and 100');
    }
    
    // Validate animation settings
    if (settings.sankey?.animation.duration && (settings.sankey.animation.duration < 0 || settings.sankey.animation.duration > 5000)) {
      errors.push('Animation duration must be between 0 and 5000ms');
    }
    
    // Validate height settings
    if (settings.sankey?.layout.customHeight && (settings.sankey.layout.customHeight < 200 || settings.sankey.layout.customHeight > 2000)) {
      errors.push('Fixed height must be between 200 and 2000 pixels');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleSave = useCallback((): void => {
    const validation = validateSettings(tempSettings);
    
    if (!validation.isValid) {
      alert('Validation errors:\n\n' + validation.errors.join('\n'));
      return;
    }
    
    const configJson = JSON.stringify(tempSettings, null, 2);
    try {
      client.config.set({ config: configJson });
      onSave(tempSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  }, [tempSettings, client, onSave]);

  const handleCancel = useCallback((): void => {
    setTempSettings(currentSettings);
    onClose();
  }, [currentSettings, onClose]);



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plugin Settings</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-border overflow-x-auto">
          <Button
            variant={activeTab === 'nodes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('nodes')}
            className="rounded-b-none whitespace-nowrap"
          >
            Nodes
          </Button>
          <Button
            variant={activeTab === 'links' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('links')}
            className="rounded-b-none whitespace-nowrap"
          >
            Links
          </Button>
          <Button
            variant={activeTab === 'layout' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('layout')}
            className="rounded-b-none whitespace-nowrap"
          >
            Layout
          </Button>
          <Button
            variant={activeTab === 'interaction' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('interaction')}
            className="rounded-b-none whitespace-nowrap"
          >
            Interaction
          </Button>
        </div>

        {activeTab === 'nodes' && (
          <div className="space-y-6 pt-4">
            {/* Node Dimensions */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Node Dimensions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nodeWidth">Width</Label>
                  <Input
                    id="nodeWidth"
                    type="number"
                    min="5"
                    max="100"
                    value={tempSettings.sankey?.nodes.width || DEFAULT_SANKEY_SETTINGS.nodes.width}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        nodes: {
                          ...prev.sankey!.nodes,
                          width: parseInt(e.target.value) || DEFAULT_SANKEY_SETTINGS.nodes.width
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>


            {/* Node Labels */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Node Labels</h4>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="nodeLabelsShow"
                  checked={tempSettings.sankey?.nodes.label.show !== false}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    sankey: {
                      ...prev.sankey!,
                      nodes: {
                        ...prev.sankey!.nodes,
                        label: {
                          ...prev.sankey!.nodes.label,
                          show: e.target.checked
                        }
                      }
                    }
                  }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="nodeLabelsShow" className="font-medium">Show node labels</Label>
              </div>
              
              {tempSettings.sankey?.nodes.label.show !== false && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="labelPosition">Position</Label>
                    <select
                      id="labelPosition"
                      value={tempSettings.sankey?.nodes.label.position || DEFAULT_SANKEY_SETTINGS.nodes.label.position}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        sankey: {
                          ...prev.sankey!,
                          nodes: {
                            ...prev.sankey!.nodes,
                            label: {
                              ...prev.sankey!.nodes.label,
                              position: e.target.value as any
                            }
                          }
                        }
                      }))}
                      className="block w-full border rounded px-3 py-2 text-sm bg-background text-foreground"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="inside">Inside</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelFontSize">Font Size</Label>
                    <Input
                      id="labelFontSize"
                      type="number"
                      min="8"
                      max="24"
                      value={tempSettings.sankey?.nodes.label.fontSize || DEFAULT_SANKEY_SETTINGS.nodes.label.fontSize}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        sankey: {
                          ...prev.sankey!,
                          nodes: {
                            ...prev.sankey!.nodes,
                            label: {
                              ...prev.sankey!.nodes.label,
                              fontSize: parseInt(e.target.value) || DEFAULT_SANKEY_SETTINGS.nodes.label.fontSize
                            }
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-6 pt-4">
            {/* Link Appearance */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Link Appearance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkCurveness">Curveness</Label>
                  <Input
                    id="linkCurveness"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={tempSettings.sankey?.links.curveness || DEFAULT_SANKEY_SETTINGS.links.curveness}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        links: {
                          ...prev.sankey!.links,
                          curveness: parseFloat(e.target.value) || DEFAULT_SANKEY_SETTINGS.links.curveness
                        }
                      }
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">0 = straight, 1 = very curved</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkOpacity">Opacity</Label>
                  <Input
                    id="linkOpacity"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={tempSettings.sankey?.links.opacity || DEFAULT_SANKEY_SETTINGS.links.opacity}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        links: {
                          ...prev.sankey!.links,
                          opacity: parseFloat(e.target.value) || DEFAULT_SANKEY_SETTINGS.links.opacity
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Link Colors */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Link Colors</h4>
              <div className="space-y-2">
                <Label htmlFor="linkColorMode">Color Mode</Label>
                <select
                  id="linkColorMode"
                  value={tempSettings.sankey?.links.colorMode || DEFAULT_SANKEY_SETTINGS.links.colorMode}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    sankey: {
                      ...prev.sankey!,
                      links: {
                        ...prev.sankey!.links,
                        colorMode: e.target.value as any
                      }
                    }
                  }))}
                  className="block w-full border rounded px-3 py-2 text-sm bg-background text-foreground"
                >
                  <option value="gradient">Gradient</option>
                  <option value="source">Source color</option>
                  <option value="target">Target color</option>
                  <option value="none">Custom color</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Gradient creates color transitions along the links
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6 pt-4">
            {/* Layout Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Layout Options</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="layoutOrient">Orientation</Label>
                  <select
                    id="layoutOrient"
                    value={tempSettings.sankey?.layout.orient || DEFAULT_SANKEY_SETTINGS.layout.orient}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        layout: {
                          ...prev.sankey!.layout,
                          orient: e.target.value as any
                        }
                      }
                    }))}
                    className="block w-full border rounded px-3 py-2 text-sm bg-background text-foreground"
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeAlign">Node Alignment</Label>
                  <select
                    id="nodeAlign"
                    value={tempSettings.sankey?.layout.nodeAlign || DEFAULT_SANKEY_SETTINGS.layout.nodeAlign}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        layout: {
                          ...prev.sankey!.layout,
                          nodeAlign: e.target.value as any
                        }
                      }
                    }))}
                    className="block w-full border rounded px-3 py-2 text-sm bg-background text-foreground"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Height Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Height Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heightMode">Height Mode</Label>
                  <select
                    id="heightMode"
                    value={tempSettings.sankey?.layout.heightMode || DEFAULT_SANKEY_SETTINGS.layout.heightMode}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        layout: {
                          ...prev.sankey!.layout,
                          heightMode: e.target.value as any
                        }
                      }
                    }))}
                    className="block w-full border rounded px-3 py-2 text-sm bg-background text-foreground"
                  >
                    <option value="responsive">Responsive</option>
                    <option value="fixed">Fixed Height</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Responsive adapts to container size
                  </p>
                </div>
                
                {tempSettings.sankey?.layout.heightMode === 'fixed' && (
                  <div className="space-y-2">
                    <Label htmlFor="customHeight">Fixed Height (px)</Label>
                    <Input
                      id="customHeight"
                      type="number"
                      min="200"
                      max="2000"
                      value={tempSettings.sankey?.layout.customHeight || DEFAULT_SANKEY_SETTINGS.layout.customHeight}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        sankey: {
                          ...prev.sankey!,
                          layout: {
                            ...prev.sankey!.layout,
                            customHeight: parseInt(e.target.value) || DEFAULT_SANKEY_SETTINGS.layout.customHeight
                          }
                        }
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Height in pixels (200-2000)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Layout Spacing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Spacing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nodeGap">Node Gap</Label>
                  <Input
                    id="nodeGap"
                    type="number"
                    min="0"
                    max="50"
                    value={tempSettings.sankey?.layout.nodeGap || DEFAULT_SANKEY_SETTINGS.layout.nodeGap}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        layout: {
                          ...prev.sankey!.layout,
                          nodeGap: parseInt(e.target.value) || DEFAULT_SANKEY_SETTINGS.layout.nodeGap
                        }
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="levelGap">Level Gap</Label>
                  <Input
                    id="levelGap"
                    type="number"
                    min="10"
                    max="200"
                    value={tempSettings.sankey?.layout.levelGap || DEFAULT_SANKEY_SETTINGS.layout.levelGap}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        layout: {
                          ...prev.sankey!.layout,
                          levelGap: parseInt(e.target.value) || DEFAULT_SANKEY_SETTINGS.layout.levelGap
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Layout */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Advanced</h4>
              <div className="space-y-2">
                <Label htmlFor="layoutIterations">Layout Iterations</Label>
                <Input
                  id="layoutIterations"
                  type="number"
                  min="1"
                  max="100"
                  value={tempSettings.sankey?.layout.iterations || DEFAULT_SANKEY_SETTINGS.layout.iterations}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    sankey: {
                      ...prev.sankey!,
                      layout: {
                        ...prev.sankey!.layout,
                        iterations: parseInt(e.target.value) || DEFAULT_SANKEY_SETTINGS.layout.iterations
                      }
                    }
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values improve layout quality but increase processing time
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interaction' && (
          <div className="space-y-6 pt-4">
            {/* Tooltip Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Tooltips</h4>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="tooltipShow"
                  checked={tempSettings.sankey?.tooltip.show !== false}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    sankey: {
                      ...prev.sankey!,
                      tooltip: {
                        ...prev.sankey!.tooltip,
                        show: e.target.checked
                      }
                    }
                  }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="tooltipShow" className="font-medium">Show tooltips</Label>
              </div>

              {tempSettings.sankey?.tooltip.show !== false && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="tooltipFormatter">Tooltip Format</Label>
                    <Input
                      id="tooltipFormatter"
                      type="text"
                      value={tempSettings.sankey?.tooltip.formatter || DEFAULT_SANKEY_SETTINGS.tooltip.formatter}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        sankey: {
                          ...prev.sankey!,
                          tooltip: {
                            ...prev.sankey!.tooltip,
                            formatter: e.target.value
                          }
                        }
                      }))}
                      placeholder="{b} : {c}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{b}"} for node name, {"{c}"} for value
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Emphasis Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Hover Effects</h4>
              <div className="space-y-2">
                <Label htmlFor="emphasisFocus">Focus Mode</Label>
                <select
                  id="emphasisFocus"
                  value={tempSettings.sankey?.interaction.emphasis.focus || DEFAULT_SANKEY_SETTINGS.interaction.emphasis.focus}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    sankey: {
                      ...prev.sankey!,
                      interaction: {
                        ...prev.sankey!.interaction,
                        emphasis: {
                          ...prev.sankey!.interaction.emphasis,
                          focus: e.target.value as any
                        }
                      }
                    }
                  }))}
                  className="block w-full border rounded px-3 py-2 text-sm bg-background text-foreground"
                >
                  <option value="none">None</option>
                  <option value="self">Self only</option>
                  <option value="adjacency">Connected nodes/links</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Controls which elements are highlighted when hovering
                </p>
              </div>
            </div>

            {/* Animation Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Animation</h4>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="animationEnabled"
                  checked={tempSettings.sankey?.animation.enabled !== false}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    sankey: {
                      ...prev.sankey!,
                      animation: {
                        ...prev.sankey!.animation,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="animationEnabled" className="font-medium">Enable animations</Label>
              </div>

              {tempSettings.sankey?.animation.enabled !== false && (
                <div className="space-y-2">
                  <Label htmlFor="animationDuration">Duration (ms)</Label>
                  <Input
                    id="animationDuration"
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={tempSettings.sankey?.animation.duration || DEFAULT_SANKEY_SETTINGS.animation.duration}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      sankey: {
                        ...prev.sankey!,
                        animation: {
                          ...prev.sankey!.animation,
                          duration: parseInt(e.target.value) || DEFAULT_SANKEY_SETTINGS.animation.duration
                        }
                      }
                    }))}
                  />
                </div>
              )}
            </div>
          </div>
        )}


        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;



