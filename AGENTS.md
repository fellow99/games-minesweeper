## 基础设施
本程序会话以中文交流为主，思考输出也应该以中文为主。
确认是不是有git环境，如果没有就创建。
确认是不是有git-commit工具技能，注意提交代码的注释一定要按该技能描述的注释前缀，不能写其它的。
确认是不是有speckit工具技能，把相关speckit技能和使用流程列举出来。
确认是不是有specs-based-devflow工具技能，一般用这个工具技能的流程来做开发。
确认是不是有playwright相关工具，可以用来调试/测试程序。
visual-engineering这个子agent配置了有视觉能力的模型，可以用于视觉分析、或者通过视觉分析输出代码。
每次执行新任务前，都先阅读AGENTS.md、AGENTS.md、specs规范文档。

## 程序框架
- windows本地+浏览器运行环境
- 使用HTML+CSS+JS作为技术选型
- 不引用任何第三方库（如果必须引用则先找我确认）
- 不使用后台服务，不产生任何端口
- 双击index.html即可正常运行
- 本工程基本目录结构：
	- <根目录>
		- AGENTS.md		本文档
		- README.md		本工程介绍文档
		- specs/		规范文档目录
			- *.md		按speckit工具技能生成的规范文档
		- index.html	程序入口页
		- style/		样式目录
			- style.css	主样式文件
			- *.css		其他样式文件
		- js/			JS代码目录
			- main.js		主代码文件
			- *.js		其他代码文件
		- images/		图片资源目录
			- 各种图片资源
