# Sigma Computing Sankey Chart Plugin

A feature-rich Sankey diagram plugin for Sigma Computing, built with React, TypeScript, and ECharts.

## Features

### Core Functionality
- **Interactive Sankey Diagrams**: Create beautiful flow diagrams showing relationships between source and target nodes
- **Dynamic Data Processing**: Transform Sigma data into Sankey format with automatic aggregation
- **Real-time Validation**: Comprehensive data validation with helpful error messages
- **Performance Optimized**: Handles large datasets efficiently

### Customization Options

#### Node Settings
- Adjustable node width
- Configurable node alignment (left, right, justify)
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
- Keyboard shortcuts for settings access

### Advanced Features
- **Error Boundary**: Graceful error handling with user-friendly messages
- **Data Validation**: Automatic detection and validation of data issues
- **Settings Persistence**: All customizations saved to Sigma configuration

## Data Requirements

The plugin requires three columns from your Sigma data source:

1. **Source Column**: Contains the source node names
2. **Target Column**: Contains the target node names  
3. **Value Column**: Contains the numeric flow values between nodes
4. **ID Column (Optional)**: Contains unique identifiers for link selection functionality

## Getting Started

1. Add this plugin to your Sigma Computing workbook
2. Select a data source from your workbook
3. Configure the required columns (Source, Target, Value, and optionally ID)
4. Customize the appearance using the comprehensive settings panel

## Settings Categories

### Nodes
- Width configuration
- Label display and positioning
- Font size and styling options

### Links
- Curveness and appearance
- Color modes: gradient, source-based, target-based, custom
- Opacity controls

### Layout
- Orientation (horizontal/vertical)
- Node alignment (left, right, justify)
- Height mode (responsive/fixed)
- Spacing controls (node gap, level gap)
- Layout iterations for optimization

### Interaction
- Tooltip configuration and formatting
- Hover effects and focus modes
- Animation settings (enable/disable, duration)

## Keyboard Shortcuts

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