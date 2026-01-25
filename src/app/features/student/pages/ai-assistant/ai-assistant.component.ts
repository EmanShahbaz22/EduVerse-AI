import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

interface Message {
  sender: 'AI' | 'User';
  content: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css']
})
export class AiAssistantComponent {
  user = {
    name: 'Samantha Bee',
    role: 'Student',
    profileImg: 'https://i.pravatar.cc/40?img=3'
  };

  messages: Message[] = [
    {
      sender: 'AI',
      content:
        'Hello Student ! I’m here to help you study. What would you like to focus on today? You can ask me a question or use one of the quick actions.'
    }
  ];

  userInput: string = '';

  sendMessage() {
    if (!this.userInput.trim()) return;

    // Push user message
    this.messages.push({ sender: 'User', content: this.userInput });

    const question = this.userInput.toLowerCase();
    this.userInput = '';

    // Dummy AI responses (replace with backend call later)
    let aiResponse = '';
    if (question.includes('french revolution')) {
      aiResponse = `
        Of course! The main causes of the French Revolution can be summarized into three key areas:
        <ul class="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Social Inequality:</strong> Society was rigidly divided into three estates...</li>
          <li><strong>Economic Troubles:</strong> France was in severe debt...</li>
          <li><strong>Enlightenment Ideas:</strong> Thinkers like Rousseau and Voltaire promoted ideas...</li>
        </ul>`;
    } else {
      aiResponse = "That's interesting! Could you please clarify or ask another question?";
    }

    // Simulate delay for realism
    setTimeout(() => {
      this.messages.push({ sender: 'AI', content: aiResponse });
    }, 800);
  }

  // Quick action buttons
  handleQuickAction(action: string) {
    if (action === 'summarize') {
      this.userInput = 'Summarize the lecture on History of Art.';
    } else if (action === 'quiz') {
      this.userInput = 'Generate a practice quiz on Renaissance Artists.';
    }
    this.sendMessage();
  }
}
