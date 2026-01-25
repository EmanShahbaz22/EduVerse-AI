import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // ye service puri app mai available hogi
})
export class AnimationService {
  // IntersectionObserver object bna rhy  jo dekhayga ke element screen pe visible hua ya nahi
  private observer?: IntersectionObserver;

  
   // yeh method scroll animation start karta hai
   // saare elements jinpe "fade-in" class lagi hogi, 
   // unko viewport mtlb k screen pe aate hi "visible" class mil jayegi.
   
  initScrollAnimations() {
    // Observer ke options (kab animation trigger karni hai)
    const observerOptions = {
      threshold: 0.1,              // jab element ka 10% visible ho tab trigger ho
      rootMargin: '0px 0px -50px 0px' // thoda pehle se trigger kar dega
    };

    // Observer create karna
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Agar element screen pe aa gaya to "visible" class add karo
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Saare elements jinke paas "fade-in" class hai unko observe karo
    document.querySelectorAll('.fade-in').forEach(el => {
      this.observer?.observe(el);
    });
  }

  
   // yeh method observer ko band karne ke liye hai 
   // taake jab component destroy ho to memory leak na ho.
   
  destroy() {
    this.observer?.disconnect();
  }
}
