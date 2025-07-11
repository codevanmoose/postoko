import { createClient } from '@postoko/database';
import { AITemplate, TemplateVariable, ProcessedTemplate } from '../types';

export class TemplateEngine {
  private supabase = createClient();

  // Process template with variables
  processTemplate(
    template: AITemplate,
    variables: Record<string, any>
  ): ProcessedTemplate {
    let prompt = template.prompt_template;
    const templateVars = this.extractVariables(template.prompt_template);

    // Replace variables in prompt
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }

    return {
      prompt,
      variables: templateVars,
      estimated_cost: this.estimateCost(prompt),
    };
  }

  // Extract variables from template
  private extractVariables(template: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const regex = /{{(\w+)}}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      const name = match[1];
      if (!variables.find(v => v.name === name)) {
        variables.push({
          name,
          type: 'text',
          label: this.formatLabel(name),
          required: true,
        });
      }
    }

    return variables;
  }

  private formatLabel(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private estimateCost(prompt: string): number {
    // Rough estimation based on token count
    const tokens = Math.ceil(prompt.length / 4);
    return Math.round(tokens * 0.002); // Estimated cost in cents
  }
}