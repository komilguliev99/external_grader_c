/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-02 22:53:07
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-07 18:59:40
 * @ Description:
 */

var fs = require('fs');
var gl = require('../../config/global')

var Trace = {
	traceFile: `./${gl.grader.path}traces`,
	trace: '',

	write: function (data, append) {
		this.trace += data;
	},

	getContent: function () {
		return this.trace;
	},

	clearTrace: () => this.trace = ''
}

module.exports = Trace;