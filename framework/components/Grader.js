/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-01 15:16:46
 * @ Modified by: Komil Guliev
 * @ Modified time: 2019-12-02 23:22:54
 * @ Description:
 */

const util = require('util');
const exec = util.promisify(require('child_process').exec);
var fs = require('fs');
var Valgrind = require('./Valgrind');

var Grader = {
	variant: 1,
	userOut: 'user_out',
	valgrind: Valgrind,
	currentTask: 1,
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
		let what = out ? 'output_' : 'input_';
		return `${this.testpathTemplate}${this.getVariant()}/${this.getTask()}/${what}${this.getFormat(num)}`;
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
		let cmd = `gcc user_task${this.currentTask}.c -o binary_${this.getFormat(this.currentTask)}`;
		console.log(cmd);
		let executed = await this.execute(cmd);
		
		if (executed) return 1;
		return 0;
	},

	checkOutputs: async function (test) {
		var output = await fs.readFileSync(this.getTestPath(test, true));
		var user_out = await fs.readFileSync('user_out');

		output = output.toString().trim();
		user_out = user_out.toString().trim();

		console.log(`OUTPUT: $${output}$`);
		console.log(`USEROUT: $${user_out}$`);
		for (let i = 0; i < output.length; i++)
			if (output[i] != user_out[i])
				return false;
		if (output.length != user_out.length)
			return false;
		return true;
	},

	executeBinary: async function(test) {
		console.log(`${this.valgrind.getCommand()} ../binary_${this.getFormat(this.currentTask)} \< ${this.getTestPath(test)} > ${this.userOut}`);
		await this.execute(`${this.valgrind.getCommand()} ./binary_${this.getFormat(this.currentTask)} \< ${this.getTestPath(test)} > ${this.userOut}`);

		this.valgrind.checkLog();
		if (await this.checkOutputs(test))
			return this.results['task' + this.currentTask].push(1);
		return this.results['task' + this.currentTask].push(0);
	},

	getResults: function () {
		let result = `user_task${this.getFormat(this.currentTask)}.cpp: `;
		let arr = this.results['task' + this.currentTask];
		arr.forEach(el => result += (el ? '[OK]' : '[FAIL]'));
		return result;
	},
	startFor: async function (task) {
		this.currentTask = task;
		let compiled = await this.compileFiles();

		if (compiled) {
			let i = 1, exist = true;
			exist = fs.existsSync(this.getTestPath(i));
			while (exist)
			{
				await this.executeBinary(i);	
				exist = fs.existsSync(this.getTestPath(++i));
			}
		}
		console.log(this.getResults());
	},
	run: async function () {
		await this.startFor(1);
		await this.startFor(2);
	}
};

module.exports = Grader;