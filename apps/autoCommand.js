import lodash from 'lodash'
import { plugin, segment, Bot, KarinMessage } from '#Karin'
import loader from '../../../lib/plugins/loader.js'
import SparkClient from '../lib/spark/client.js'
import Cfg from '../lib/config/config.js'

let tempCommandList
export class AutoCommand extends plugin {
  constructor() {
    super({
      /** 插件名称 */
      name: 'AutoCommand',
      /** 插件描述 */
      dsc: '自动化命令',
      event: 'message',
      priority: 999999,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#(\\?|？)',
          /** 执行方法 */
          fnc: 'autoCommand',
          /** 权限 master,owner,admin,all  */
          permission: 'all'
        },
        {
          /** 命令正则匹配 */
          reg: '^#命令列表',
          /** 执行方法 */
          fnc: 'commandList',
          /** 权限 master,owner,admin,all  */
          permission: 'all'
        }
      ]
    })
  }

  async autoCommand() {
    let msg = this.e.msg.replace(/^#(\\?|？)/, '')
    if (msg === '')  return
    let apps = lodash.cloneDeep(loader.Apps)
    apps = apps.map(item => {
      if (item.rule && Array.isArray(item.rule)) {
        item.rule = item.rule.map(rule => {
          if (rule.reg) {
            rule.reg = rule.reg.toString()
          }
          return rule
        })
      }
      return item
    })
    const instructions = {}
    // 将指令按照 file.dir 分类
    apps.forEach(command => {
      const { file, name, rule } = command
      if (!instructions[file.dir]) {
        instructions[file.dir] = {}
      }

      // 添加子类和对应的规则
      instructions[file.dir][name] = rule.map(r => {
        return { reg: r.reg, example: r.reg.replace(/\//g, '').replace(/\^|\$/g, '') }
      })
    })

    const client = new SparkClient({
      Domain: Cfg.Spark.Domain,
      AppId: Cfg.Spark.AppId,
      APISecret: Cfg.Spark.APISecret,
      APIKey: Cfg.Spark.APIKey,
      Temperature: 0.1,
      MaxTokens: 2048
    })

    const command = await client.sendMessage(msg, {
      prompt: [
        {
          "role": Cfg.Spark.Domain === "general" ? "user" : "system",
          "content": `你是一个命令生成工具，根据用户的要求生成从命令列表中生成命令，如果有多个可用命令，选择相关性最高的命令回复，确保回复内容可以被命令列表中的正则表达式匹配。
          例如当我说“我想检查是否有系统更新”时你需要回复
          #检查更新`
        },
        {
          "role": "user",
          "content": `
                  命令列表
                  ${JSON.stringify(instructions)}
              `
        }
      ]
    })
    if (command) {
      this.e.elements = this.e.elements.map(item => {
        if (item.text === this.e.msg) {
          return segment.text(command.text)
        }
        return item
      })
      this.e.msg = command.text
      this.e.raw_message = command.text
      const message = {
        self_id: this.e.self_id,
        user_id: this.e.user_id,
        time: this.e.time,
        message_id: this.e.message_id,
        message_seq: this.e.message_seq,
        sender: {
          uid: this.e.sender.uid,
          uin: this.e.sender.uin,
          nick: this.e.sender.nick
        },
        elements: this.e.elements,
        contact: this.e.contact,
        group_id: this.e.group_id,
      }
      const e = new KarinMessage(message)
      e.replyCallback = async (elements) => {
        const { uid, uin } = this.e.bot.account
        return Bot.sendMsg(
          uid || uin,
          this.e.contact,
          elements
        )
      }
      Bot.emit('message', e)
    }
  }
  async commandList() {
    if (tempCommandList) {
      this.reply(tempCommandList)
      return
    }
    let apps = lodash.cloneDeep(loader.Apps)
    apps = apps.map(item => {
      if (item.rule && Array.isArray(item.rule)) {
        item.rule = item.rule.map(rule => {
          if (rule.reg) {
            rule.reg = rule.reg.toString()
          }
          return rule
        })
      }
      return item
    })
    const instructions = {}
    // 将指令按照 file.dir 分类
    apps.forEach(command => {
      const { file, name, rule } = command
      if (!instructions[file.dir]) {
        instructions[file.dir] = {}
      }

      // 添加子类和对应的规则
      instructions[file.dir][name] = rule.map(r => {
        return { reg: r.reg, example: r.reg.replace(/\//g, '').replace(/\^|\$/g, '') }
      })
    })
    const client = new SparkClient({
      Domain: Cfg.Spark.Domain,
      AppId: Cfg.Spark.AppId,
      APISecret: Cfg.Spark.APISecret,
      APIKey: Cfg.Spark.APIKey,
      Temperature: 0.1,
      MaxTokens: 2048
    })

    const command = await client.sendMessage(JSON.stringify(instructions), {
      prompt: [
        {
          "role": Cfg.Spark.Domain === "general" ? "user" : "system",
          "content": `你是一个正则表达式示例生成功能，根据给定结构中的reg正则表达式生成示例字符串，生成的示例要求可直接被正则表达式匹配，回复我的内容只包含各个项目的列表，不包含功能说明。`
        }
      ]
    })
    if (command) {
      tempCommandList = command.text
      this.reply(command.text)
    }
  }
}
