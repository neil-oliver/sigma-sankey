# Sigma Computing Sankey Chart Plugin

A feature-rich Sankey diagram plugin for Sigma Computing, built with React, TypeScript, and ECharts.

## Features

### Core Functionality
- **Interactive Sankey Diagrams**: Create beautiful flow diagrams showing relationships between source and target nodes
- **Dynamic Data Processing**: Transform Sigma data into Sankey format with automatic aggregation
- **Real-time Validation**: Comprehensive data validation with helpful error messages
- **Performance Optimized**: Handles large datasets efficiently with progress indicators

### Customization Options

#### Node Settings
- Adjustable node width and padding
- Configurable node alignment (left, right, justify)
- Draggable nodes for interactive exploration
- Customizable labels with positioning and styling options

#### Link Settings
- Variable link curveness for aesthetic control
- Multiple color modes: gradient, source-based, target-based
- Adjustable opacity and line styles
- Support for gradient fills

#### Layout Controls
- Horizontal and vertical orientations
- Configurable spacing between nodes and levels
- Advanced layout iterations for optimal positioning
- Responsive design for different screen sizes

#### Interactive Features
- Hover effects with adjacency highlighting
- Configurable tooltips with custom formatting
- Click events for nodes and links
- Keyboard shortcuts for quick access

### Export Capabilities
- **PNG Export**: High-resolution bitmap images for presentations
- **SVG Export**: Vector graphics for editing and scaling
- **Custom Settings**: Configurable filenames and background colors
- **Keyboard Shortcuts**: Ctrl/Cmd+E for PNG, Ctrl/Cmd+Shift+E for SVG

### Advanced Features
- **Error Boundary**: Graceful error handling with user-friendly messages
- **Performance Monitoring**: Automatic detection and handling of large datasets
- **Theme Integration**: Works seamlessly with Sigma's light/dark themes
- **Settings Persistence**: All customizations saved to Sigma configuration

## Data Requirements

The plugin requires three columns from your Sigma data source:

1. **Source Column**: Contains the source node names
2. **Target Column**: Contains the target node names  
3. **Value Column**: Contains the numeric flow values between nodes

## Getting Started

1. Add this plugin to your Sigma Computing workbook
2. Select a data source from your workbook
3. Configure the three required columns (Source, Target, Value)
4. Customize the appearance using the comprehensive settings panel
5. Export your diagrams in PNG or SVG format

## Settings Categories

### General
- Chart title configuration
- Basic display options

### Styling  
- Theme selection (light/dark/custom)
- Custom color palettes
- Dynamic theming options

### Nodes
- Dimensions and spacing
- Label configuration
- Interaction settings

### Links
- Appearance and curvature
- Color modes and gradients
- Opacity controls

### Layout
- Orientation and alignment
- Spacing and iterations
- Advanced positioning

### Interaction
- Tooltip configuration
- Hover effects
- Animation settings

### Export
- Format options (PNG/SVG)
- File naming and backgrounds
- Export permissions

## Keyboard Shortcuts

- `Ctrl/Cmd + E`: Export as PNG
- `Ctrl/Cmd + Shift + E`: Export as SVG  
- `Ctrl/Cmd + ,`: Open settings

## Technical Details

- **Framework**: React 18 with TypeScript
- **Charting Library**: ECharts 5.5+
- **UI Components**: Radix UI with Tailwind CSS
- **Performance**: Optimized for datasets up to 10,000+ rows
- **Browser Support**: Modern browsers with ES6+ support

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## License

This plugin is designed for use with Sigma Computing workbooks.