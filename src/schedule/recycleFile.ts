// 定时回收文件以及处理上传失败的文件夹

import * as fs from "fs";
import { join } from 'path'

import { FileStatus } from "@/type/fileStatus";
import { deleteFolder,FileHound } from "@/util/utils";
import { uploadStatus } from "@/uploader/uploadStatus";
import { uploader } from "@/uploader";
import { roomPathStatus } from "@/engine/roomPathStatus";
import { Scheduler } from "@/type/scheduler";
import { RecorderTask } from "@/type/recorderTask";
import { getExtendedLogger } from "@/log";

const logger = getExtendedLogger(`recycleFile`);
const recycleCheckTime = global.config.StreamerHelper.recycleCheckTime
const interval = recycleCheckTime ? recycleCheckTime * 1000 : 5 * 60 * 1000

export default new Scheduler(interval, async function () {
    logger.info(`Task recycleFile Start ...`)

    function _deleteLocalFile(obj: FileStatus) {
        logger.info(`Try to delete local directory: ${obj.path}`)

        if (!obj.path) throw (`NOT FOUND THE FILE PATH`);
        if (roomPathStatus.get(obj.path) === 1) return;

        if (uploadStatus.get(obj.path) === 1) return

        if (!obj.endRecordTime) {
            logger.info(`Not Fount endRecordTime... Use startRecordTime ${obj.startRecordTime} to replace`)
            obj.endRecordTime = obj.startRecordTime
        }

        const daysDif = Math.floor((new Date().valueOf() - new Date(obj.endRecordTime as Date).valueOf()) / (1000 * 60 * 60 * 24))
        const delayTime = obj.delayTime ?? 2

        if (daysDif >= delayTime && obj.isPost) {
            logger.info(`Time to delete file ${obj.path}`)
            try {
                deleteFolder(obj.path || '')
                logger.info(`Directory deleted successfully: ${obj.path}`)
            } catch (e) {
                throw (`Failed to delete directory: ${obj.path},error: ${e}`)
            }
        }else{
            logger.info(`Delay time is not enough to delete file.`)
        }
    }

    function _uploadLocalFile(obj: FileStatus) {

        logger.info(`Try to upload local directory: ${obj.path}`)

        if (!obj.path) throw (`NOT FOUND THE FILE PATH`);

        if (roomPathStatus.get(obj.path) === 1) return;

        if (uploadStatus.get(obj.path) === 1) return

        const recorderTask: RecorderTask = {
            streamerInfo: {
                name: obj.recorderName || "",
                uploadLocalFile: obj.uploadLocalFile || true,
                deleteLocalFile: obj.deleteLocalFile || true,
                templateTitle: obj.templateTitle || "",
                delayTime: obj.delayTime || 2,
                desc: obj.desc || "",
                source: obj.source || "",
                dynamic: obj.dynamic || "",
                copyright: obj.copyright || 2,
                roomUrl: obj.recorderLink || '',
                tid: obj.tid || 0,
                tags: obj.tags || [],
                duration : obj.duration || 1

            },
            dirName: obj.path,
            recorderName: obj.recorderName || '',
            streamUrl: '',
            timeV: obj.timeV as string
        }


        logger.info(`NEW Upload Task ${recorderTask.recorderName} ${recorderTask.dirName}`);
        logger.debug(`upload recorderTask: ${JSON.stringify(recorderTask, null, 2)}`)
        const uploadTask = new uploader(recorderTask)
        uploadTask.upload()
            .catch((e) => {
                logger.error(e)
            })
            .finally(() =>
                uploadStatus.delete(recorderTask.dirName)
            )

    }

    const files: string[] = await FileHound.create()
        .paths(join(process.cwd(), "/download"))
        .match('fileStatus.json')
        .ext('json')
        .find();

    if (!files) return

    for (const file of files) {
        const text = fs.readFileSync(file)
        const obj: FileStatus = JSON.parse(text.toString())

        logger.debug(`fileStatus: ${file} ${JSON.stringify(obj, null, 2)}`)
        try {
            //  Check uploadLocalFile
            if (obj.uploadLocalFile && !obj.isPost) _uploadLocalFile(obj)
        } catch (e) {
            logger.error(e)
        }

        try {
            //  Check deleteLocalFile
            if (obj.deleteLocalFile) _deleteLocalFile(obj)
        } catch (e) {
            logger.error(e)
        }

    }
})