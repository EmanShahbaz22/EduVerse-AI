import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CommonModule } from '@angular/common';
import { ChangePasswordComponent } from '../../../../shared/components/change-password/change-password.component';
import { ProfileFormComponent } from '../../../../shared/components/profile-form/profile-form.component';
@Component({
  selector: 'app-teacher-settings',
  imports: [
    HeaderComponent,
    CommonModule,
    ChangePasswordComponent,
    ProfileFormComponent,
  ],
  templateUrl: './teacher-settings.component.html',
  styleUrl: './teacher-settings.component.css',
})
export class TeacherSettingsComponent {
  activeTab: 'profile' | 'system' = 'profile';
}
