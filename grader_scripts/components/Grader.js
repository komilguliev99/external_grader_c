/**
 * @ Author: Komil Guliev
 * @ Create Time: 2019-12-01 15:16:46
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-07 18:58:13
 * @ Description:
 */

const 		util = require('util');
const 		exec = util.promisify(require('child_process').exec);
const 		fs = require('fs');
const 		Valgrind = require('./Valgrind');
const 		Trace = require('./Trace');
const 		gl = require('../../config/global')
const 		lib = require('../../config/lib')

const Grader = {
	variant: 1,
	userOut: null,
	valgrind: Valgrind,
	trace: Trace,
	localTrace: '',
	currentTask: 1,
	hash: '',
	taskFiles: [],
	results: [],
	grades: [],

	initConfgis: function ()
	{
		if (!gl.grader.path)
			console.log("The PATH of grader not setted!");
		this.path = gl.grader.path;
		this.binaryDelete = gl.delete_binary === undefined ? true : gl.delete_binary;
		this.status = gl.grader.status;
		this.testpathTemplate = `./${this.path}tests/variant_`
	},

	getFormat: function(number)
	{
		if (number < 10) return '0' + number;
		return number.toString();
	},


	reset: function()
	{
		this.resultData = '';
		this.results = [];
		this.localTrace = '';
		this.valgrind.reset();
	},

	setVariant: function (variant, types, taskCount)
	{

	},

	resetAll: function()
	{
		this.reset();
		this.results = [];
		this.grades = [];
		this.taskFiles = [];
	},


	getVariant: function ()
	{
		return this.getFormat(this.variant);
	},


	getTask: function ()
	{
		return this.getFormat(this.currentTask);
	},


	getTestPath: function(num, out)
	{
		let 	what = out ? 'output_' : 'input_';
		
		return `${this.testpathTemplate}${this.getVariant()}/${this.getTask()}/${what}${this.getFormat(num)}`;
	},


	generateHash: function ()
	{
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	},


	execute: async function(command)
	{
		console.log(command);
		this.processHash = this.generateHash();
		const { err, stdout, stderr } = await exec(command);
		if (err)
			return 0;
		return stdout;
	},


	getTrace: function ()
	{
		return this.trace.getContent();
	},


	getValgrindCmd:  function ()
	{
		return this.valgrind.command + ' --log-file=' + this.valgrind.logFIle;
	},


	compileFiles: async function()
	{
		try {
			let 	cmd = `gcc ./${this.path}user_task.c -o ./${this.path}binary_${this.hash}`;
			let 	executed = await this.execute(cmd);
			
			return 1;
		} catch(error) {
			this.localTrace += `Задание ${this.currentTask} не компилируется\n
			Результат компилятора:\n${error}`
			return 0;
		}
	},


	checkOutputs: async function (test)
	{
		var 	output = fs.readFileSync(this.getTestPath(test, true));
		var 	user_out = this.userOut.trim();

		output = output.toString().trim();

		for (let i = 0; i < output.length; i++)
			if (output[i] != user_out[i])
				return false;
		if (output.length != user_out.length)
			return false;
		return true;
	},


	executeBinary: async function(test, resolve)
	{
		this.userOut = await this.execute(`${this.valgrind.getCommand()} ./${this.path}binary_${this.hash} \< ${this.getTestPath(test)}`);
		this.valgrind.checkLog();
		if (await this.checkOutputs(test)) {
			this.results.push(1);
			resolve("OK");
			return 0;
		}
		this.results.push(0);
		resolve("OK");
		return 0;
	},

	setResults: function (task, append = false)
	{
		let			testWeight = 100/this.results.length;
		let			falls = this.weights[this.taskCount] ? this.weights[this.taskCount] : 25;
		this.localTrace += '\n*ТЕСТЫ:'
		this.results.forEach(el => {
			this.localTrace += `[${this.status[el]}]`;
			if (el == 1)
				this.grades[task - 1] += testWeight;
		});
		console.log("GRADE: ", this.grades[task - 1]);
		if (!this.valgrind.getStatus())
			this.grades[task - 1] -= falls;
		this.localTrace += '\n*УТЕЧКИ В ПАМЯТИ:' + this.valgrind.getLogs();
		this.localTrace += 'GRADE: ' + this.grades[task - 1] + '\n```\n\n';

		this.trace.write(this.localTrace, append);
		return this.localTrace;
	},


	getAssignedGrade: function ()
	{
		let			grade = 0;
		let			i = 0;
		let			defaultWeight = (1/this.taskCount) * 100;

		while (i < this.taskCount)
		{
			let weight = this.weights.length > 0 ? this.weights[i] : defaultWeight;
			console.log("WIEGHT: ", weight);
			console.log("GRADES: ", this.grades[i]);
			if (this.grades[i] && Number(weight))
				grade += (this.grades[i] * weight) / 100;
			i++;
		}

		return Math.round(grade);
	},

	inOutTask: async function (task)
	{
		this.currentTask = task;
		this.hash = this.generateHash();
		this.localTrace +=`\n**task_${task}:**\n` + "```";
		this.grades[task - 1] = 0;
		let 	compiled = await this.compileFiles();

		if (compiled) {
			let i = 1, exist = true;
			exist = fs.existsSync(this.getTestPath(i));
			while (exist)
			{
				await new Promise( (resolve, reject) => {
					setTimeout(() => {
						reject("time_out");
					}, 5000);
					this.executeBinary(i, resolve, task);
				})
				.then (res => console.log("RES: ", res))
				.catch(err => {
					this.results.push(2);
				});					
				exist = fs.existsSync(this.getTestPath(++i));
			}
			if (this.binaryDelete)
				this.execute(`rm ./${this.path}binary_${this.hash}`);
		}
		this.setResults(task, false);
		this.reset();
	},
	
	startFor: async function (task)
	{
		fs.writeFileSync('./grader_scripts/user_task.c', this.taskFiles[task - 1]);

		if (this.types[task - 1] === 1)
		{
			await this.inOutTask(task);
		}
		else
			console.log("Another type!");
	},


	run: async function ()
	{
		let		i = 0;

		while (this.taskCount > 0 && i <= this.taskCount && this.taskFiles[i])
			await this.startFor(++i);
	}
};

Grader.initConfgis();

module.exports = Grader;