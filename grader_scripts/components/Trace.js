/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-02 22:53:07
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-25 10:46:59
 * @ Description:
 */

var fs = require('fs');
var global = require('../../configs/global')

var Trace = {
	traceFile: `./${global.GRADER.PATH}traces`,

	write: function (data, append) {
		if (append)
			fs.appendFileSync(this.traceFile, data);
		else
			fs.writeFileSync(this.traceFile, data);
	},

	getContent: function () {
		let content = fs.readFileSync(this.traceFile);
		return content.toString();
	}
}

module.exports = Trace;