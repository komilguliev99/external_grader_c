/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-11-29 11:25:42
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-25 10:45:41
 * @ Description:
 */

var fs = require('fs');
var global = require('../../configs/global');

var Valgrind = {
	cmd: global.VALGRIND.CMD,
	logFile: `./${global.GRADER.PATH}${global.VALGRIND.LOG_FILE}`,
	whatLeaks: Object.keys(global.VALGRIND.LEAKS_MESSAGES),
	leakMessage: global.VALGRIND.LEAKS_MESSAGES,
	templateMessages: global.VALGRIND.TEMPLATES,
	leaks: {},

	getCommand: function () {
		return `${this.cmd} --log-file=${this.logFile}`;
	},

	reset: function() {
		this.leaks = {};
	},

	calcLeak: function(type) {
		let 	log = this.logContent;
		let 	index = log.lastIndexOf(type + ' lost'), endLine;
		let		bytes;
		let		blocks;
		let		message;
		
		if (index != -1)
		{
			endLine = log.indexOf('\n', index);
			message = log.slice(index, endLine);
			bytes = parseInt(message.slice(type.length + 6));
			blocks = parseInt(message.slice(message.indexOf(' in ') + 4));
			
			if (this.leaks[type] === undefined) this.leaks[type] = {};
			this.leaks[type].bytes = (this.leaks[type].bytes && this.leaks[type].bytes < bytes || !this.leaks[type].bytes) ? bytes : this.leaks[type].bytes;
			this.leaks[type].blocks = (this.leaks[type].blocks && this.leaks[type].blocks < blocks || !this.leaks[type].blocks) ? blocks : this.leaks[type].blocks;
			this.leaks[type].message = message;

			console.log(this.leaks[type]);
		}
	},

	checkLog: function () {
		var 	log = fs.readFileSync(this.logFile);

		this.logContent = log.toString();
		//console.log(log);
		this.whatLeaks.forEach(type => this.calcLeak(type));
		
	},

	getStatus: function () {
		let 	bytes = 0;

		Object.keys(this.leaks).forEach(key => bytes += this.leaks[key].bytes);
		if (bytes == 0) return 1
		return 0;
	},

	getMessage: function(type) {
		let		message;

		if (this.leaks[type].bytes)
		{
			message = this.templateMessages.EXIST_LEAK;

			message = message.replace("%BYTES%", this.leaks[type].bytes);
			message = message.replace("%NUM%", this.leaks[type].blocks);
			message = message.replace("%TYPE%", this.leakMessage[type]);

			if (this.leaks[type].blocks === 1)
			{
				console.log("this.leaks[type].blocks:   ", this.leaks[type].blocks)
				message = message.slice(0, message.length - 2) + "е";
			}
		}
		else
		{
			message = this.templateMessages.NOT_EXIST;
			message = message.replace("%TYPE%", this.leakMessage[type]);

		}
		return message;
	},

	getLogs: function () {
		let 	keys = Object.keys(this.leaks);
		let		logs = keys.length > 0 ? '\n' : '';
		
		keys.forEach(key => logs += '\t\t\t' + this.getMessage(key) + '\n');
		if (keys.length === 0) logs += "\n\t\t\t" + this.templateMessages.NO_LEAKS + "\n";
		return logs;
	}
}

module.exports = Valgrind;