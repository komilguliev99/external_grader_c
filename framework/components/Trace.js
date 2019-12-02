/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-02 22:53:07
 * @ Modified by: Komil Guliev
 * @ Modified time: 2019-12-02 22:57:38
 * @ Description:
 */

var fs = require('fs');

var Trace = {
	traceFile: 'traces',

	write: function (data) {
		fs.writeFileSync(this.traceFile, data);
	},

	getContent: function () {
		let content = fs.readFileSync(this.traceFile);
		return content.toString();
	}
}
