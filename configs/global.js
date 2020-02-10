/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 21:41:30
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-25 17:29:50
 * @ Description:
 */

var global = {
	GITLAB_DOMAIN: 'https://git.miem.hse.ru/api/v4',
	GITLAB_ACCESS_TOKEN: 'ffVrpATDs77Q9xPtisM7',
	GITLAB_PROJECT_NAME: 'th',
	GITLAB_STUDENTS_INFO: 'gitlab_scripts/students.json',
	GITLAB_FILES: ['code1.c', 'code2.c'],

	GRADER: {
		PATH: 'grader_scripts/',
		TASK1: 'user_task1.c',
		TASK2: 'user_task2.c',

		BINARY_DELET: true,

		TASK_STATUS: ["FAIL", "OK", "ERROR", "TIME_OUT"]
	},

	VALGRIND: {
		CMD: "valgrind",
		LOG_FILE: "valgrindLog",
		TEMPLATES: {
			EXIST_LEAK: "%BYTES% байта %TYPE% утечек в %NUM% блоках",
			NOT_EXIST: "Нет %TYPE% утечек в программе",
			NO_LEAKS: "Все блоки кучи были освобождены - утечки невозможны",
		},
		LEAKS_MESSAGES: {
			definitely: "точных",
			indirectly: "косвенных",
			possibly: "возможных",
		}
	},
	
}

module.exports = global;