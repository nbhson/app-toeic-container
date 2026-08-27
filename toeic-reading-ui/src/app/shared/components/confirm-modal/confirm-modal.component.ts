import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmModalComponent {
  title = input<string>('Xác nhận rời khỏi trang');
  message = input<string>('Bạn đang làm bài dở dang, nếu rời đi toàn bộ câu trả lời chưa nộp trong phiên này sẽ bị mất.');
  confirmText = input<string>('Rời khỏi');
  cancelText = input<string>('Ở lại tiếp tục');

  confirm = output<void>();
  cancel = output<void>();
}
