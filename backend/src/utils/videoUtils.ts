import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// 设置 ffmpeg 路径
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * 获取视频文件的时长（秒）
 * @param filePath 视频文件路径
 * @returns Promise<number> 视频时长（秒）
 */
export const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      if (!metadata || !metadata.format || !metadata.format.duration) {
        reject(new Error('无法获取视频时长'));
        return;
      }

      resolve(Math.round(metadata.format.duration));
    });
  });
};

/**
 * 获取视频文件的时长（分钟）
 * @param filePath 视频文件路径
 * @returns Promise<number> 视频时长（分钟，保留两位小数，更精确地表示秒数）
 */
export const getVideoDurationInMinutes = (filePath: string): Promise<number> => {
  return getVideoDuration(filePath).then(durationInSeconds => {
    // 保留两位小数，更精确地表示秒数
    return Math.round((durationInSeconds / 60) * 100) / 100;
  });
};