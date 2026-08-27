import { Component, ChangeDetectionStrategy, Inject, PLATFORM_ID, OnInit, inject, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToeicService } from '../../../core/services/toeic.service';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { STORAGE_KEYS, THEME_MODES } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, SettingsModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  readonly toeicService = inject(ToeicService);

  // Modern Signal Query to fetch component reference
  readonly settingsModalQuery = viewChild(SettingsModalComponent);

  isDarkMode = true;
  readonly showModal = this.toeicService.showSettingsModal;
  hasApiKey = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Load current theme
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === THEME_MODES.LIGHT) {
        this.isDarkMode = false;
        document.body.classList.remove(THEME_MODES.DARK_CLASS);
        document.body.classList.add(THEME_MODES.LIGHT_CLASS);
      } else {
        this.isDarkMode = true;
        document.body.classList.remove(THEME_MODES.LIGHT_CLASS);
        document.body.classList.add(THEME_MODES.DARK_CLASS);
      }

      // Load initial key status
      this.onKeySaved();
    }
  }

  toggleTheme() {
    if (isPlatformBrowser(this.platformId)) {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        document.body.classList.remove(THEME_MODES.LIGHT_CLASS);
        document.body.classList.add(THEME_MODES.DARK_CLASS);
        localStorage.setItem(STORAGE_KEYS.THEME, THEME_MODES.DARK);
      } else {
        document.body.classList.remove(THEME_MODES.DARK_CLASS);
        document.body.classList.add(THEME_MODES.LIGHT_CLASS);
        localStorage.setItem(STORAGE_KEYS.THEME, THEME_MODES.LIGHT);
      }
    }
  }

  openSettings() {
    this.showModal.set(true);
  }

  closeSettings() {
    this.showModal.set(false);
  }

  onKeySaved() {
    this.hasApiKey = !!this.toeicService.getApiKey();
  }
}
