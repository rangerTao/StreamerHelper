import * as fs from "fs"
import { join } from 'path'
import { EventEmitter } from 'events'
import * as dayjs from "dayjs";

import { log4js } from "@/log/config";
import { FileStatus } from "@/type/fileStatus";

export const RoomTypeArr = ["huya", "bilibili", "douyu"];

export const testRoomTypeArr = (roomType: string) => {
  if (RoomTypeArr.some((type) => type === roomType)) return roomType;
  else return "error";
};

/**
 * 获取当前时间戳(秒)
 */
export const getTimestamp = function() {
  return Math.floor(Date.now() / 1000);
}

export const getTitlePostfix =function() {
  const hour = parseInt(dayjs().format("HH"))

  if (hour >= 0 && hour < 6) return '凌晨'

  if (hour >= 6 && hour < 12) return '早上'

  if (hour >= 12 && hour < 18) return '下午'

  if (hour >= 18 && hour < 24) return '晚上'
  return ''
}

export const FileHound = require("filehound")

export const deleteFolder = function (path: string) {
  try {
    if (fs.existsSync(path)) {
      const files = fs.readdirSync(path);
      files.forEach((file) => {
        const curPath = join(path, file)
        if (!fs.statSync(curPath).isDirectory()) {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  } catch (err) {
    throw err
  }
};

export const changeFileStatus = (status: FileStatus, fileStatusPath: string) => {
    // Merge a `source` object to a `target` recursively
    const merge = (target: any, source: any) => {
        // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
        //Add checkpoints 增加校验
        if (target) {
            for (const key of Object.keys(source)) {
                if (source[key] instanceof Object) Object.assign(source[key], merge(target[key], source[key]))
            }
        }

        // Join `target` and modified `source`
        Object.assign(target || {}, source)
        return target
    }

    if (fs.existsSync(fileStatusPath)) {
        const text = fs.readFileSync(fileStatusPath)
        const obj: FileStatus = JSON.parse(text.toString())
        merge(obj, status)
        const stringifies = JSON.stringify(obj, null, 2)
        fs.writeFileSync(fileStatusPath, stringifies)
        log4js.getLogger().info(`Write Content ${JSON.stringify(obj, null, 2)}`)
    }
}

export const emitter = new EventEmitter();
