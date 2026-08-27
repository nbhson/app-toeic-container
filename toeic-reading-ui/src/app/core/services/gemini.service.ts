import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToeicQuestion, ToeicPart6Passage, ToeicPart7Passage } from '../models/toeic.model';
import { GEMINI_CONFIG } from '../constants/app.constants';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly http = inject(HttpClient);

  constructor() {}

  /**
   * Helper method to call Gemini API
   */
  private async generateContent<T>(
    prompt: string,
    responseSchema: any,
    apiKey: string,
  ): Promise<T> {
    const url = `${GEMINI_CONFIG.API_BASE_URL}/${GEMINI_CONFIG.MODEL}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    };

    try {
      const responseData = await firstValueFrom(
        this.http.post<any>(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResult) {
        throw new Error('Không nhận được nội dung trả về từ Gemini API.');
      }

      return JSON.parse(textResult) as T;
    } catch (error) {
      console.error('Lỗi khi gọi Gemini API:', error);
      throw error;
    }
  }

  /**
   * Generates custom TOEIC Part 5 questions using Gemini API
   * @param count Number of questions to generate
   * @param apiKey Gemini API Key
   */
  async generateToeicQuestions(count: number, apiKey: string): Promise<ToeicQuestion[]> {
    const prompt = `Hãy tạo ${count} câu hỏi trắc nghiệm tiếng Anh bám sát cấu trúc phần thi TOEIC Part 5 (Incomplete Sentences).
Mỗi câu hỏi phải là một câu tiếng Anh hoàn chỉnh có chứa một khoảng trống ký hiệu là '_______'.
Cung cấp đúng 4 lựa chọn (options) tương ứng với A, B, C, D.
Phân chia cân đối các chủ đề: Grammar (Ngữ pháp), Vocabulary (Từ vựng), Word Forms (Từ loại).
Đáp án đúng (correctAnswer) là chỉ số index từ 0 đến 3 (0 đại diện cho A, 1 đại diện cho B, 2 cho C, 3 cho D).
Hãy cung cấp dịch nghĩa tiếng Việt (translation) và giải thích chi tiết lý do chọn đáp án đúng bằng tiếng Việt (explanation).
Độ khó (difficulty) chọn ngẫu nhiên giữa "Easy", "Medium", "Hard".
Tạo các id ngẫu nhiên độc nhất dạng chuỗi như 'g-q1', 'g-q2'...
Đảm bảo tất cả nội dung phong phú, chất lượng cao, đúng cấu trúc câu thi TOEIC thực tế.`;

    const responseSchema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          question: { type: 'STRING' },
          options: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            minItems: 4,
            maxItems: 4,
          },
          correctAnswer: { type: 'INTEGER' },
          translation: { type: 'STRING' },
          explanation: { type: 'STRING' },
          category: { type: 'STRING', enum: ['Grammar', 'Vocabulary', 'Word Forms'] },
          difficulty: { type: 'STRING', enum: ['Easy', 'Medium', 'Hard'] },
        },
        required: [
          'id',
          'question',
          'options',
          'correctAnswer',
          'translation',
          'explanation',
          'category',
          'difficulty',
        ],
      },
    };

    return this.generateContent<ToeicQuestion[]>(prompt, responseSchema, apiKey);
  }

  /**
   * Generates a list of TOEIC Part 6 passages using Gemini 2.5 Flash API
   */
  async generateToeicPart6Passages(count: number, apiKey: string): Promise<ToeicPart6Passage[]> {
    const prompt = `Hãy đóng vai trò là một chuyên gia khảo thí TOEIC chuyên nghiệp. Tạo đúng ${count} đoạn văn luyện tập TOEIC Part 6 (Text Completion) chất lượng cao.
Mỗi đoạn văn phải chứa đúng 4 chỗ trống được ký hiệu lần lượt là [131], [132], [133], [134] (nếu là đoạn văn thứ nhất), hoặc [135], [136], [137], [138] (nếu là đoạn văn thứ hai), tương ứng với 4 câu hỏi trắc nghiệm.
Tổng cộng 4 câu hỏi trong mỗi đoạn văn cần phủ các dạng bài:
- Ít nhất 1 câu về Ngữ pháp (Grammar)
- Ít nhất 1 câu về Từ vựng (Vocabulary)
- Ít nhất 1 câu về Từ loại (Word Forms)
- Đúng 1 câu về Điền câu thích hợp vào đoạn văn (Sentence Insertion)

Nội dung đoạn văn có thể là email công việc, thư báo, bản ghi nhớ, quảng cáo... văn phong trang trọng, chuyên nghiệp chuẩn đề thi TOEIC.
Giải thích lý do lựa chọn đáp án chi tiết bằng tiếng Việt trong trường explanation.
Tạo các id ngẫu nhiên độc nhất dạng chuỗi cho đoạn văn (ví dụ: 'p6-p1') và các câu hỏi (ví dụ: 'p6-p1-q1').
Đảm bảo tất cả nội dung phong phú, chất lượng cao, đúng cấu trúc câu thi TOEIC thực tế.`;

    const responseSchema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          text: { type: 'STRING' },
          translation: { type: 'STRING' },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                questionNumber: { type: 'INTEGER' },
                options: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  minItems: 4,
                  maxItems: 4,
                },
                correctAnswer: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
                category: {
                  type: 'STRING',
                  enum: ['Grammar', 'Vocabulary', 'Word Forms', 'Sentence Insertion'],
                },
              },
              required: [
                'id',
                'questionNumber',
                'options',
                'correctAnswer',
                'explanation',
                'category',
              ],
            },
            minItems: 4,
            maxItems: 4,
          },
        },
        required: ['id', 'text', 'translation', 'questions'],
      },
    };

    return this.generateContent<ToeicPart6Passage[]>(prompt, responseSchema, apiKey);
  }

  /**
   * Generates a list of TOEIC Part 7 passages using Gemini 2.5 Flash API
   */
  async generateToeicPart7Passages(
    passageType: 'Single' | 'Double' | 'Triple',
    count: number,
    startQuestionNumber: number,
    apiKey: string,
  ): Promise<ToeicPart7Passage[]> {
    const prompt = `Hãy đóng vai trò là một chuyên gia khảo thí TOEIC chuyên nghiệp. Tạo đúng ${count} đoạn văn luyện tập TOEIC Part 7 (Reading Comprehension) thuộc thể loại ${passageType} Passage.
Bắt đầu đánh số thứ tự câu hỏi từ câu số ${startQuestionNumber}.

Quy định cấu trúc chi tiết:
- Với mỗi đoạn văn (passage):
  + id: một id duy nhất dạng chuỗi (ví dụ: 'p7-p-${passageType.toLowerCase()}-1')
  + passageType: '${passageType}'
  + documentType: loại tài liệu (ví dụ: 'Email', 'Notice', 'Advertisement', 'Article', 'Chat Discussion', 'Webpage')
  + text: Nội dung tài liệu/đoạn văn bằng tiếng Anh. 
    * Nếu là Single Passage: chỉ chứa nội dung của 1 tài liệu.
    * Nếu là Double Passage: chứa đúng 2 tài liệu liên quan đến nhau. Hãy phân tách chúng rõ ràng bằng cấu trúc HTML sau:
      <div class="passage-part"><h5>Document 1: [Loại tài liệu, ví dụ: Advertisement]</h5><p>...</p></div><hr class="passage-divider"/><div class="passage-part"><h5>Document 2: [Loại tài liệu, ví dụ: Email]</h5><p>...</p></div>
    * Nếu là Triple Passage: chứa đúng 3 tài liệu liên quan đến nhau. Phân tách rõ ràng bằng thẻ HTML tương tự và ngăn cách giữa các tài liệu bằng <hr class="passage-divider"/>.
  + translation: Bản dịch nghĩa chi tiết toàn bộ các tài liệu trong đoạn văn sang tiếng Việt (nếu là Double/Triple, dịch cả 2/3 tài liệu phân tách rõ ràng).
  + questions: Danh sách các câu hỏi đi kèm đoạn văn này.
    * Với Single Passage: Số lượng câu hỏi của mỗi đoạn văn dao động từ 2 đến 4 câu.
    * Với Double/Triple Passage: Mỗi đoạn văn phải có ĐÚNG 5 câu hỏi đi kèm.

- Mỗi câu hỏi (question) trong mảng questions phải có cấu trúc:
  + id: id độc nhất dạng chuỗi (ví dụ: 'p7-q-\${startQuestionNumber}')
  + questionNumber: số thứ tự câu hỏi dạng số nguyên (tăng dần liên tiếp từ ${startQuestionNumber})
  + question: câu hỏi đọc hiểu bằng tiếng Anh liên quan đến nội dung đoạn văn
  + options: đúng 4 lựa chọn trả lời (A, B, C, D) bằng tiếng Anh
  + correctAnswer: số nguyên chỉ số index đáp án đúng (từ 0 đến 3 tương ứng với A, B, C, D)
  + explanation: giải thích chi tiết lý do lựa chọn đáp án đúng bằng tiếng Việt
  + translation: dịch câu hỏi và 4 lựa chọn sang tiếng Việt

Hãy đảm bảo thông tin, từ vựng và ngữ cảnh bám sát đề thi TOEIC thật, các câu hỏi logic, có sự liên kết thông tin giữa các tài liệu đối với dạng Double/Triple passage.`;

    const responseSchema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          passageType: { type: 'STRING', enum: ['Single', 'Double', 'Triple'] },
          documentType: { type: 'STRING' },
          text: { type: 'STRING' },
          translation: { type: 'STRING' },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                questionNumber: { type: 'INTEGER' },
                question: { type: 'STRING' },
                options: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  minItems: 4,
                  maxItems: 4,
                },
                correctAnswer: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
                translation: { type: 'STRING' },
              },
              required: [
                'id',
                'questionNumber',
                'question',
                'options',
                'correctAnswer',
                'explanation',
                'translation',
              ],
            },
          },
        },
        required: ['id', 'passageType', 'documentType', 'text', 'translation', 'questions'],
      },
    };

    return this.generateContent<ToeicPart7Passage[]>(prompt, responseSchema, apiKey);
  }
}
