/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-02 22:53:07
 * @ Modified by: Komil Guliev
 * @ Modified time: 2019-12-08 14:27:45
 * @ Description:
 */

var fs = require('fs');

var Trace = {
	traceFile: 'traces',

	write: function (data) {
		fs.appendFileSync(this.traceFile, data);
	},

	getContent: function () {
		let content = fs.readFileSync(this.traceFile);
		return content.toString();
	}
}

module.exports = Trace;