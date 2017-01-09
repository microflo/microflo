
exports.wsConnectionFormatToFbp = (ws) ->
  if ws.src and ws.src.port
    src:
      port: ws.src.port
      process: ws.src.node
    tgt:
      port: ws.tgt.port
      process: ws.tgt.node
  else
    # IIP
    out = {}
    out.tgt =
      port: ws.tgt.port
      process: ws.tgt.node
    out.data = ws.src.data if ws.src
    out

# inverse of wsConnectionFormatToFbp()
fbpConnectionFormatToWs = (fbp) ->
  if fbp.src
    # Connection
    src:
      port: fbp.src.port
      node: fbp.src.process
    tgt:
      port: fbp.tgt.port
      node: fbp.tgt.process
  else
    # IIP
    src:
      data: fbp.data
    tgt:
      port: fbp.tgt.port
      node: fbp.tgt.process

# Get a list of FBP runtime messages for building given graph
graphToFbpMessages = (graph, graphName) ->
  messages = []
  secret = null

  # Instantiate components
  for nodeName, process of graph.processes
    messages.push
      protocol: 'graph'
      command: 'addnode'
      payload:
        id: nodeName
        component: process.component
        graph: graphName
        secret: secret

  # Connect nodes
  for connection in graph.connections
    if connection.data
      continue # IIP
    p = fbpConnectionFormatToWs connection
    p.secret = secret
    p.graph = graphName
    messages.push
      protocol: 'graph'
      command: 'addedge'
      payload: p

  # Send IIPs
  for connection in graph.connections
    if not connection.data
      continue # Connection
    p = fbpConnectionFormatToWs connection
    p.secret = secret
    p.graph = graphName
    messages.push
      protocol: 'graph'
      command: 'addinitial'
      payload: p

  return messages

exports.graphToFbpMessages = graphToFbpMessages 
