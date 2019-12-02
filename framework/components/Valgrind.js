/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-11-29 11:25:42
 * @ Modified by: Komil Guliev
 * @ Modified time: 2019-12-02 22:50:54
 * @ Description:
 */

var fs = require('fs');

var Valgrind = {
	cmd: 'valgrind',
	logFile: 'valgrindLog',
	whatLeaks: ['definitely', 'indirectly', 'possibly'],
	leaks: {},

	getCommand: function () {
		return `${this.cmd} --log-file=${this.logFile}`;
	},

	calcLeak: function(type) {
		let log = this.logContent;
		let index = log.lastIndexOf(type + ' lost'), endLine;
		if (index != -1)
		{
			endLine = log.indexOf('\n', index);
			let message = log.slice(index, endLine);
			if (this.leaks[type] === undefined) this.leaks[type] = {};
			this.leaks[type].bytes = parseInt(message.slice(type.length + 6));
			this.leaks[type].blocks = parseInt(message.slice(message.indexOf(' in ') + 4));
			this.leaks[type].message = message;

			console.log(message, this.leaks[type].bytes, this.leaks[type].blocks);
		}
	},

	checkLog: function () {
		var log = fs.readFileSync(this.logFile);
		this.logContent = log.toString();
		//console.log(log);
		this.whatLeaks.forEach(type => this.calcLeak(type));
		
	},

	getStatus: function () {
		let bytes = 0;
		Object.keys(this.leaks).forEach(key => bytes += leaks[key].bytes);
		if (bytes == 0) return 1
		return 0;
	},

	getLogs: function () {
		let logs = '';
		Object.keys(this.leaks).forEach(key => logs += this.leaks[key].message + '\n');
		return logs;
	}
}

module.exports = Valgrind;