import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationService } from './services/animation.service';
import { HeroComponent } from './components/hero/hero.component';
import { TenantSectionComponent } from './components/tenant-section/tenant-section.component';
import { AiDemoComponent } from './components/ai-demo/ai-demo.component';
import { FeaturesComponent } from './components/features/features.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { CtaComponent } from './components/cta/cta.component';
import { FooterComponent } from './components/footer/footer.component';
import { LandingpageHeaderComponent } from './components/landingpage-header/landingpage-header.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    TenantSectionComponent,
    AiDemoComponent,
    FeaturesComponent,
    HowItWorksComponent,
    CtaComponent,
    FooterComponent,
    LandingpageHeaderComponent,
  ],

  templateUrl: './landing-page.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent implements OnInit, OnDestroy {
  title = 'eduverse-ai-platform';

  constructor(private animationService: AnimationService) {}

  ngOnInit() {
    // it will Initialize scroll animations after view init that means when webiste is first time loading only then animation will be applied
    setTimeout(() => {
      this.animationService.initScrollAnimations();
    }, 100);
  }

  ngOnDestroy() {
    this.animationService.destroy();
  }
}
