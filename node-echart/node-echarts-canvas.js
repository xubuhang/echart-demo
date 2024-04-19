var http = require('http')
var echarts = require('node-echarts-canvas')
var url = require('url')

function processConfig (request, response, callback) {
  var queryData = ''
  if (typeof callback !== 'function') {
    return null
  }
  if (request.method === 'GET') {
    var arg = url.parse(request.url, true).query
    if (!arg.config) {
      response.end('request parameter "config" invalid')
      return
    }
    request.config = arg.config
    callback()
  } else {
    request.on('data', function (data) {
      queryData += data
      if (queryData.length > 1e6) {
        response.end('request body too large')
      }
    })
    request.on('end', function () {
      request.config = queryData
      callback()
    })
  }
}

var server = http.createServer(function (request, response) {
  processConfig(request, response, function () {
    var config
    try {
      config = JSON.parse(request.config)
    } catch (e) {
      response.end('request parameter "config" format invalid, is not JSON')
      return
    }
    if (!config || !config.option) {
      response.end('request parameter "config" format invalid')
      return
    }

    var buffer = echarts({
      option: config.option,
      width: config.width || 600,
      height: config.height || 400
    })
    response.setHeader('Content-Type', 'image/png')
    response.write(buffer)
    response.end()
  })
})

var hostName = '0.0.0.0'
var port = 8081
server.listen(port, hostName, function () {
  console.log(`server started at port ${port}`)
})
// http://localhost:8082/?config=%7B%22width%22%3A800%2C%22height%22%3A500%2C%22option%22%3A%7B%22backgroundColor%22%3A%22%23fff%22%2C%22xAxis%22%3A%7B%22type%22%3A%22category%22%2C%22data%22%3A%5B%22Mon%22%2C%22Tue%22%2C%22Wed%22%2C%22Thu%22%2C%22Fri%22%2C%22Sat%22%2C%22Sun%22%5D%7D%2C%22yAxis%22%3A%7B%22type%22%3A%22value%22%7D%2C%22series%22%3A%5B%7B%22data%22%3A%5B820%2C932%2C901%2C934%2C1290%2C1330%2C1320%5D%2C%22type%22%3A%22line%22%7D%5D%7D%7D