/**
 * 模拟 LLM 流式文字输出
 * 
 * @param text - 要输出的完整文本
 * @param onUpdate - 每次更新时的回调函数，接收当前已输出的部分文本
 * @param speed - 每个字符的延迟时间（毫秒），默认 30ms
 * @returns Promise<void>
 */
export const streamText = async (
  text: string,
  onUpdate: (partial: string) => void,
  speed: number = 30
): Promise<void> => {
  let current = '';
  for (const char of text) {
    current += char;
    onUpdate(current);
    await new Promise(r => setTimeout(r, speed));
  }
};

/**
 * 根据内容长度动态调整流式输出速度
 * 长文本速度更快，短文本速度适中
 * 
 * @param text - 要输出的文本
 * @param onUpdate - 更新回调
 * @param baseSpeed - 基础速度（毫秒），默认 30ms
 */
export const streamTextDynamic = async (
  text: string,
  onUpdate: (partial: string) => void,
  baseSpeed: number = 30
): Promise<void> => {
  const length = text.length;
  
  // 根据文本长度调整速度
  // 短文本（<100字符）：正常速度
  // 中等文本（100-500字符）：稍快
  // 长文本（>500字符）：更快
  let speed = baseSpeed;
  if (length > 500) {
    speed = Math.max(10, baseSpeed * 0.5);
  } else if (length > 100) {
    speed = Math.max(15, baseSpeed * 0.7);
  }
  
  await streamText(text, onUpdate, speed);
};

/**
 * 按词流式输出（更自然的阅读体验）
 * 
 * @param text - 要输出的文本
 * @param onUpdate - 更新回调
 * @param wordDelay - 每个词的延迟（毫秒），默认 50ms
 */
export const streamTextByWord = async (
  text: string,
  onUpdate: (partial: string) => void,
  wordDelay: number = 50
): Promise<void> => {
  // 按空格和换行符分割，但保留分隔符
  const tokens = text.split(/(\s+)/);
  let current = '';
  
  for (const token of tokens) {
    current += token;
    onUpdate(current);
    // 只在实际词（非空白）后延迟
    if (token.trim()) {
      await new Promise(r => setTimeout(r, wordDelay));
    }
  }
};
