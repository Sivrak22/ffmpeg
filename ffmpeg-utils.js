const { spawn } = require('node:child_process');
const fs = require("fs");
const path = require("path");

function getImgsPerSeconds(file = 'video.webm',numberOfFrames = '1/1',output = 'img.png'){
    return new Promise((res,rej)=>{   
        try{
            let directory = 'tmpData';
            fs.readdir(directory, (err, files) => {
                if (err) throw err;
                for (const file of files) {
                  fs.unlink(path.join(directory, file), (err) => {
                    if (err) throw err;
                  });
                }
              });
            const ffmpeg = spawn('ffmpeg', [
                '-i',
                file,
                '-vf',
                'fps='+numberOfFrames,
                './'+directory+'/f'+'%04d'+output
            ]);
            
            ffmpeg.stderr.on('data', (data) => {
                console.log(data.toString());
            });
            
            ffmpeg.on('exit', () => {
                console.log(`Image generated successfully`);
                res();
            });
        }catch(e){
            console.log("Error In ffmpeg-util",e);
            rej();
        }
    });
}

function getMetadata(file = 'video.webm'){
    return new Promise((res,rej)=>{   
        try{
            const ffprobe = spawn('ffprobe', [
                '-loglevel',
                0,
                '-print_format',
                'json',
                '-show_format',
                '-show_streams',
                '-show_programs',
                '-show_chapters',
                '-show_private_data',
                file
            ]);
            let resp = {};
            ffprobe.stdout.on('data',(data)=>{
                resp += data;
            })
            ffprobe.stderr.on('data', (data) => {
                console.log(data.toString(),'/nERROR');
            });
            
            ffprobe.on('exit', () => {
                console.log(`Video metadata generated successfully`,resp);
                resp = resp.replaceAll('[object Object]','');
                res(resp);
            });
        }catch(e){
            console.log("Error In ffmpeg-util ffprobe",e);
            rej();
        }
    });
}

exports.getImgsPerSeconds = getImgsPerSeconds;
exports.getMetadata = getMetadata;