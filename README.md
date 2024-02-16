# Example Node for Node-RED Dashboard

This repository contains an example, third-party, node for the Node-RED Dashboard. You can read our [contribution guide](https://dashboard.flowfuse.com/contributing/widgets/third-party.html) for details on developing your own Dashboard 2.0 integrations & widgets.

This project is intended to be used as a starting point for creating your own custom nodes that can integrate directly with [Node-RED Dashboard 2.0](https://github.com/FlowFuse/flowforge-nr-dashboard).

Note that if you're looking to contribute directly to Node-RED Dashboard 2.0, then use the examples already in the core repository to build on, as they are structured differently to external/third-party widgets.

## Architecture

All third-party (non-core) nodes for Node-RED Dashboard 2.0 are structured such that they extend the core `ui-template` node, and provide access such that you can define custom HTML, CSS, and JavaScript for your widget.