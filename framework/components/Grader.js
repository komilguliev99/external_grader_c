/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-01 15:16:46
 * @ Modified by: Komil Guliev
 * @ Modified time: 2019-12-08 14:40:59
 * @ Description:
 */

const util = require('util');
const exec = util.promisify(require('child_process').exec);
var fs = require('fs');
var Valgrind = require('./Valgrind');
var Trace = require('./Trace');

var Grader = {
	variant: 1,
	userOut: 'user_out',
	valgrind: Valgrind,
	trace: Trace,
	currentTask: 1,
	hash: '',
	resultData: '',
	results: {
		task1: [],
		task2: [],
	},
	testpathTemplate: 'tests/variant_',

	getFormat: function(number) {
		if (number < 10) return '0' + number;
		return number.toString();
	},
	getVariant: function () {
		return this.getFormat(this.variant);
	},
	getTask: function () {
		return this.getFormat(this.currentTask);
	},
	getTestPath: function(num, out) {
		let 	what = out ? 'output_' : 'input_';
		
		return `${this.testpathTemplate}${this.getVariant()}/${this.getTask()}/${what}${this.getFormat(num)}`;
	},
	generateHash: function () {
		this.hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	},
	execute: async function(command) {
		const { err, stdout, stderr } = await exec(command);
		if (err)
			return 0;
		return 1;
	},
	getValgrindCmd:  function () {
		return this.valgrind.command + ' --log-file=' + this.valgrind.logFIle;
	},
	compileFiles: async function() {
		let 	cmd = `gcc user_task${this.currentTask}.c -o binary_${this.hash}`;
		let 	executed = await this.execute(cmd);
		
		if (executed) return 1;
		return 0;
	},

	checkOutputs: async function (test) {
		var 	output = await fs.readFileSync(this.getTestPath(test, true));
		var 	user_out = await fs.readFileSync('user_out');

		output = output.toString().trim();
		user_out = user_out.toString().trim();

		for (let i = 0; i < output.length; i++)
			if (output[i] != user_out[i])
				return false;
		if (output.length != user_out.length)
			return false;
		return true;
	},

	executeBinary: async function(test) {
		//console.log(`${this.valgrind.getCommand()} ../binary_${this.hash} \< ${this.getTestPath(test)} > ${this.userOut}`);
		await this.execute(`${this.valgrind.getCommand()} ./binary_${this.hash} \< ${this.getTestPath(test)} > ${this.userOut}`);

		this.valgrind.checkLog();
		if (await this.checkOutputs(test)) {
			return this.results['task' + this.currentTask].push(1);
		}
		return this.results['task' + this.currentTask].push(0);
	},

	setResults: function () {
		let 	result = `user_task${this.getFormat(this.currentTask)}.cpp: \n\t\tTESTS: `;
		let 	arr = this.results['task' + this.currentTask];

		arr.forEach(el => result += (el ? '[OK]' : '[FAIL]'));
		result += '\n\t\tLEAKS:' + this.valgrind.getLogs() + '\n\n';
		this.trace.write(result);
		return result;
	},
	startFor: async function (task) {
		this.currentTask = task;
		this.generateHash();
		let 	compiled = await this.compileFiles();

		if (compiled) {
			let i = 1, exist = true;
			if (i === 1) 	this.resultData += `user_task${this.getFormat(this.currentTask)}.cpp: \n\tTESTS: %STATUS%\n`;
			else 			this.resultData += `\t\ttest_${this.getFormat(i)}: `
			exist = fs.existsSync(this.getTestPath(i));
			while (exist)
			{
				await this.executeBinary(i);	
				exist = fs.existsSync(this.getTestPath(++i));
			}
		}
		this.execute(`rm binary_${this.hash}`);
		console.log(this.setResults());
	},
	run: async function () {
		await this.startFor(1);
		await this.startFor(2);
	}
};

module.exports = Grader;