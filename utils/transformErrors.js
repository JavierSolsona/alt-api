exports.transformErrors = (errors) => {
  return errors.map((error, index) => {
      return {message: error.msg, param: error.param}
  });
}

exports.createErrorUploadFile = (message, param) => {
  return [{message: message, param: param}]
}