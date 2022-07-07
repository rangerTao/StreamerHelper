const axios = require("axios");

export function main(url: string) {
    return new Promise(function (resolve, reject) {
        axios
            .get(url)
            .then(function (response: any) {
                const html: string = response.data;
                const reg: RegExp = /(?<=("stream":[\s]*"))(.+?)(?=("[\s]*\}))/g;
                const result: any = html.match(reg);
                const reg2:RegExp = /(?<=stream:)(.+?)(?=([\s]*\};))/g;
                const result2:any = html.match(reg2);
                if ((result && result.length >= 1) ||(result2 && result2.length >=1)) {

                    let infoObj:any = ''
                    let returnString:string[] = []

                    if (result && result.length >= 1) {
                        infoObj = JSON.parse(
                            Buffer.from(result[0], "base64").toString("ascii")
                        );
                    }
                    if (result2 && result2.length >=1){
                        infoObj = JSON.parse(
                            result2[0]
                        );
                    }

                    // console.log(infoObj.data[0].gameLiveInfo.introduction)

                    // const infoObj: any = JSON.parse(
                    //     Buffer.from(result[0], "base64").toString("ascii")
                    // );
                    const streamInfoList: any =
                        infoObj.data[0].gameStreamInfoList;
                    //const streamerName = infoObj["data"][0]["gameLiveInfo"]["nick"];
                    if (streamInfoList.length < 1) {
                        reject(
                            "HUYA=>No match results:Maybe the roomid is error,or this room is not open!"
                        );
                        return
                    }else{
                        const urlInfo1: any = streamInfoList[0];
                        //const urlInfo2 = streamInfoList[1];
                        
                        //可以得到六种链接，m3u8链接最稳定
                        const aliFLV =
                            urlInfo1["sFlvUrl"] +
                            "/" +
                            urlInfo1["sStreamName"] +
                            ".flv?" +
                            urlInfo1["sFlvAntiCode"];
                        //const aliHLS:string = urlInfo1["sHlsUrl"] + "/" + urlInfo1["sStreamName"] + ".m3u8?" + urlInfo1["sHlsAntiCode"];
                        //const aliP2P = urlInfo1["sP2pUrl"] + "/" + urlInfo1["sStreamName"] + ".slice?" + urlInfo1["newCFlvAntiCode"];
                        //const txFLV = urlInfo2["sFlvUrl"] + "/" + urlInfo2["sStreamName"] + ".flv?" + urlInfo2["sFlvAntiCode"];
                        //const txHLS = urlInfo2["sHlsUrl"] + "/" + urlInfo2["sStreamName"] + ".m3u8?" + urlInfo2["sHlsAntiCode"];
                        //const txP2P = urlInfo2["sP2pUrl"] + "/" + urlInfo2["sStreamName"] + ".slice?" + urlInfo2["newCFlvAntiCode"];\
                        returnString[0] = aliFLV.replace(/\amp\;/g, "")
                        returnString[1] = infoObj.data[0].gameLiveInfo.introduction
                        resolve(returnString);
                    }
                } else {
                    reject(
                        "HUYA=>No match results:Maybe the roomid is error,or this room is not open!"
                    );
                }
            })
            .catch(function (error: any) {
                reject(error);
            });
    });
}
