/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-01 15:16:46
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-25 18:11:31
 * @ Description:
 */

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const execute = require('child_process').spawn;
var fs = require('fs');
var Valgrind = require('./Valgrind');
var Trace = require('./Trace');
var global = require('../../configs/global')
const lib = require('../../lib')

var Grader = {
	variant: 1,
	status: global.GRADER.TASK_STATUS,
	userOut: `./${global.GRADER.PATH}user_out`,
	valgrind: Valgrind,
	trace: Trace,
	currentTask: 1,
	hash: '',
	resultData: '',
	binaryDelete: global.GRADER.BINARY_DELET,
	processHash: '',
	results: {
		task1: [],
		task2: [],
	},
	testpathTemplate: `./${global.GRADER.PATH}tests/variant_`,

	getFormat: function(number) {
		if (number < 10) return '0' + number;
		return number.toString();
	},
	reset: function() {
		this.resultData = '';
		this.valgrind.reset();
	},
	resetAll: function() {
		this.reset();
		this.results = {
			task1: [],
			task2: [],
		};
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
	promisifyExec: function(command)
	{
		return new Promise((resolve, reject) => {
			this.process = lib.rangeRandom(3456, 33333333);
			let process = execute(command);
			setTimeout(() => { 
				console.log("KILLING PROCESS....");
				process.kill(this.process);
				console.log("KILLED!");
				reject("time_out")
			}, 5000);
		})
		.then(res => console.log(res))
		.catch(error => console.log("TTT: ", error));
	},
	generateHash: function () {
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	},
	execute: async function(command) {
		console.log(command);
		this.processHash = this.generateHash();
		const { err, stdout, stderr } = await exec(command);
		if (err)
			return 0;
		return 1;
	},
	getTrace: function () {
		return this.trace.getContent();
	},
	getValgrindCmd:  function () {
		return this.valgrind.command + ' --log-file=' + this.valgrind.logFIle;
	},
	compileFiles: async function() {
		try {
			let 	cmd = `gcc ./${global.GRADER.PATH}user_task${this.currentTask}.c -o ./${global.GRADER.PATH}binary_${this.hash}`;
			let 	executed = await this.execute(cmd);
			
			return 1;
		} catch(error) {
			console.log(`Задание ${this.currentTask} не компилируется`);
			console.log(`Результат компилятора:`);
			console.log(error);
			return 0;
		}
	},

	checkOutputs: async function (test) {
		//console.log("PATHES:   ", this.getTestPath(test, true), "   ---   ", `./${global.GRADER.PATH}user_out`);
		var 	output = await fs.readFileSync(this.getTestPath(test, true));
		var 	user_out = await fs.readFileSync(`./${global.GRADER.PATH}user_out`);

		output = output.toString().trim();
		user_out = user_out.toString().trim();

		//console.log("\n output: \n", output, "\n useroutput:\n", user_out, "\n\n");

		for (let i = 0; i < output.length; i++)
			if (output[i] != user_out[i])
				return false;
		if (output.length != user_out.length)
			return false;
		return true;
	},

	executeBinary: async function(test, resolve) {
		console.log("EXECUTING....");
		//console.log(`${this.valgrind.getCommand()} ./binary_${this.hash} \< ${this.getTestPath(test)} > ${this.userOut}`);
		await this.execute(`${this.valgrind.getCommand()} ./${global.GRADER.PATH}binary_${this.hash} \< ${this.getTestPath(test)} > ${this.userOut}`);
		//await this.promisifyExec(`${this.valgrind.getCommand()} ./${global.GRADER.PATH}binary_${this.hash} \< ${this.getTestPath(test)} > ${this.userOut}`);
		this.valgrind.checkLog();
		if (await this.checkOutputs(test)) {
			this.results['task' + this.currentTask].push(1);
			resolve("OK");
			return 0;
		}
		this.results['task' + this.currentTask].push(0);
		console.log(this.results['task' + this.currentTask]);
		resolve("OK");
		return 0;
	},

	setResults: function (append = false) {
		let 	result = `user_task${this.getFormat(this.currentTask)}.c: \n        ТЕСТЫ: `;
		let 	arr = this.results['task' + this.currentTask];

		arr.forEach(el => result += `[${this.status[el]}]`);
		result += '\n        УТЕЧКИ В ПАМЯТИ:' + this.valgrind.getLogs() + '\n\n';

		this.trace.write(result, append);
		return result;
	},
	
	startFor: async function (task) {
		this.currentTask = task;
		this.hash = this.generateHash();
		let 	compiled = await this.compileFiles();

		//console.log("COMPILED: ", compiled);
		if (compiled) {
			let i = 1, exist = true;
			if (i === 1) 	this.resultData += `./${global.GRADER.PATH}user_task${this.getFormat(this.currentTask)}.c: \n    ТЕСТЫ: %STATUS%\n`;
			else 			this.resultData += `        test_${this.getFormat(i)}: `
			//console.log(this.getTestPath(i));
			exist = fs.existsSync(this.getTestPath(i));
			while (exist)
			{
				try {
					await new Promise( (resolve, reject) => {
						setTimeout(() => {
							reject("time_out");
						}, 5000);
						this.executeBinary(i, resolve);
					})
					.then (res => console.log("RES: ", res))
					.catch(err => {
						//exec('kill -s ' + this.processHash);
						//console.log("ERRRRRRRRRRROR!")
						this.result['task' + this.currentTask].push(2);
					});
					//await this.executeBinary(i);
					
				} catch (error) {
					console.log("TIME_OUT: ", error);
				}
				exist = fs.existsSync(this.getTestPath(++i));
			}
			if (this.binaryDelete)
				this.execute(`rm ./${global.GRADER.PATH}binary_${this.hash}`);
		}
	},
	run: async function () {
		this.reset();
		await this.startFor(1);
		this.setResults()
		this.reset();
		await this.startFor(2);
		this.setResults(true);
		console.log("END");
	}
};

module.exports = Grader;