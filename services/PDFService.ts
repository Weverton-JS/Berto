
import { Project, Evaluation, Answer } from '@/types';
import { SAFETY_QUESTIONS, CATEGORY_NAMES } from '@/constants/SafetyQuestions';
import { Alert, Platform, Share } from 'react-native';

class PDFService {
  
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
  }

  private async convertImageToBase64(uri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        return uri;
      }
      
      const response = await fetch(uri);
      const blob = await await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Erro ao converter imagem:', error);
      return uri;
    }
  }

  private getStatusBadge(score: number): string {
    if (score >= 4) {
      return '<div class="status-badge conforme">Conforme</div>';
    } else if (score >= 2) {
      return '<div class="status-badge atencao">Atenção</div>';
    } else {
      return '<div class="status-badge nao-conforme">Não Conforme</div>';
    }
  }

  private generateMainTable(evaluation: Evaluation): string {
    let tableHTML = `
      <table class="main-table">
        <tr class="header-row">
          <td class="desc-header">DESCRIÇÃO</td>
          <td class="eval-header">AVALIAÇÃO</td>
        </tr>
        <tr class="score-row">
          <td class="score-label">NOTA</td>
          <td class="score-value">${evaluation.percentage.toFixed(3)}</td>
        </tr>
    `;

    // Agrupar questões por categoria
    Object.entries(CATEGORY_NAMES).forEach(([category, categoryName], categoryIndex) => {
      const categoryQuestions = SAFETY_QUESTIONS.filter(q => q.category === category);
      const categoryAnswers = evaluation.answers.filter(a => 
        categoryQuestions.some(q => q.id === a.questionId)
      );
      
      // Calcular score da categoria
      const totalCategoryScore = categoryAnswers.reduce((sum, answer) => {
        const question = categoryQuestions.find(q => q.id === answer.questionId);
        return sum + (answer.score * (question?.weight || 1));
      }, 0);
      
      const maxCategoryScore = categoryQuestions.reduce((sum, q) => sum + (q.weight * 5), 0);
      const categoryPercentage = maxCategoryScore > 0 ? (totalCategoryScore / maxCategoryScore) * 100 : 0;

      // Header da categoria
      tableHTML += `
        <tr class="category-row">
          <td class="category-title">${String(categoryIndex + 1).padStart(2, '0')}.${categoryName.toUpperCase()}</td>
          <td class="category-score">${categoryPercentage.toFixed(2)}</td>
        </tr>
      `;

      // Questões da categoria
            categoryQuestions.forEach(question => {
        const answer = evaluation.answers.find(a => a.questionId === question.id);
        const score = answer?.score;
        const hasNotes = answer?.notes && answer.notes.trim().length > 0;
        const hasImages = answer?.images && answer.images.length > 0;

        let scoreDisplay = '';
        if (score === null) {
          scoreDisplay = 'N/A';
        } else if (score !== undefined && score > 0) {
          scoreDisplay = score.toFixed(2);
        } else {
          scoreDisplay = '0';
        }

        tableHTML += `
          <tr class="question-row">
            <td class="question-text">${question.question.toUpperCase()}</td>
            <td class="question-score">
              ${scoreDisplay}
              ${hasNotes || hasImages ? '<span class="has-content">●</span>' : ''}
            </td>
          </tr>
        `;

        // Linha para observações se existir
        if (hasNotes) {
          tableHTML += `
            <tr class="notes-row">
              <td class="notes-text" colspan="2">OBS: ${answer.notes}</td>
            </tr>
          `;
        }
      });
    });

    tableHTML += '</table>';
    return tableHTML;
  }

  private async generatePhotographicSection(answers: Answer[]): Promise<string> {
    const answersWithImages = answers.filter(a => a.images && a.images.length > 0);
    
    if (answersWithImages.length === 0) {
      return '';
    }

    let photosHTML = `
      <div class="page-break"></div>
      <div class="photo-section">
        <h2 class="section-title">RELATÓRIO FOTOGRÁFICO E OCORRÊNCIAS</h2>
    `;

    for (const answer of answersWithImages) {
      const question = SAFETY_QUESTIONS.find(q => q.id === answer.questionId);
      const category = Object.entries(CATEGORY_NAMES).find(([cat]) => 
        SAFETY_QUESTIONS.find(sq => sq.id === answer.questionId)?.category === cat
      );
      
      if (answer.images && question && category) {
        for (let i = 0; i < answer.images.length; i++) {
          const imageUri = answer.images[i];
          const base64Image = await this.convertImageToBase64(imageUri);
          const score = answer.score || 0;
          
          photosHTML += `
            <div class="photo-item">
              <h3 class="photo-title">
                ${String(Object.keys(CATEGORY_NAMES).indexOf(category[0]) + 1).padStart(2, '0')}.${category[1].toUpperCase()} > ${question.question.toUpperCase()}
              </h3>
              
              <div class="photo-container">
                <img src="${base64Image}" alt="Foto da inspeção" class="inspection-photo" />
              </div>
              
              <div class="photo-status">
                ${this.getStatusBadge(score)}
              </div>
              
              <div class="photo-timestamp">
                ${this.formatDateTime(new Date().toISOString())}
              </div>
              
              ${answer.notes ? `
                <div class="photo-notes">
                  <strong>Observações:</strong> ${answer.notes}
                </div>
              ` : ''}
            </div>
          `;
        }
      }
    }

    photosHTML += '</div>';
    return photosHTML;
  }

  private async generateHTMLTemplate(project: Project, evaluation: Evaluation): Promise<string> {
    const mainTable = this.generateMainTable(evaluation);
    const photographicSection = await this.generatePhotographicSection(evaluation.answers);
    const currentDateTime = this.formatDateTime(new Date().toISOString());

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Inspeção - ${project.name}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
            line-height: 1.6;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .container {
            max-width: 800px;
            margin: 20px auto;
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }
          .logo-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-right: 20px;
          }
          .logo-container {
            width: 120px;
            height: 80px;
            background: #f0f0f0;
            border: 2px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #666;
            text-align: center;
            overflow: hidden;
          }
          .company-logo, .client-logo {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 4px;
          }
          .logo-label {
            font-size: 8px;
            color: #666;
            text-align: center;
            font-weight: bold;
          }
          .title-section {
            flex: 1;
          }
          .main-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .subtitle {
            text-align: center;
            font-size: 14px;
            margin-bottom: 15px;
          }
          .project-info {
            background: #f8f9fa;
            padding: 15px;
            border: 1px solid #ddd;
            margin-bottom: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 10px;
          }
          .info-item {
            font-size: 11px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .creator-info {
            text-align: right;
            font-size: 11px;
            margin-bottom: 15px;
            color: #666;
          }
          .main-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #333;
            margin-bottom: 30px;
          }
          .main-table td {
            border: 1px solid #333;
            padding: 8px;
            vertical-align: top;
            font-size: 11px;
          }
          .header-row td {
            background: #333;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 12px;
          }
          .desc-header {
            width: 70%;
          }
          .eval-header {
            width: 30%;
          }
          .score-row {
            background: #f0f0f0;
          }
          .score-label {
            font-weight: bold;
            text-align: center;
          }
          .score-value {
            font-weight: bold;
            text-align: center;
            font-size: 14px;
            color: #d32f2f;
          }
          .category-row td {
            background: #e3f2fd;
            font-weight: bold;
            font-size: 12px;
          }
          .category-title {
            color: #1976d2;
          }
          .category-score {
            text-align: center;
            font-size: 13px;
          }
          .question-row td {
            background: white;
          }
          .question-text {
            font-size: 10px;
            line-height: 1.3;
          }
          .question-score {
            text-align: center;
            font-weight: bold;
            position: relative;
          }
          .has-content {
            color: #2196f3;
            margin-left: 5px;
          }
          .notes-row td {
            background: #fff3e0;
            font-style: italic;
            font-size: 10px;
            color: #e65100;
          }
          .page-break {
            page-break-before: always;
          }
          .photo-section {
            margin-top: 30px;
          }
          .section-title {
            background: #333;
            color: white;
            padding: 15px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
          }
          .photo-item {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .photo-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
            padding: 8px;
            background: #f5f5f5;
            border-left: 4px solid #2196f3;
          }
          .photo-container {
            text-align: center;
            margin: 15px 0;
          }
          .inspection-photo {
            max-width: 400px;
            max-height: 300px;
            border: 2px solid #ddd;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .photo-status {
            text-align: center;
            margin: 15px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 20px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
          }
          .status-badge.conforme {
            background: #4caf50;
          }
          .status-badge.atencao {
            background: #ff9800;
          }
          .status-badge.nao-conforme {
            background: #f44336;
          }
          .photo-timestamp {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-bottom: 10px;
          }
          .photo-notes {
            background: #f9f9f9;
            padding: 10px;
            border-left: 4px solid #2196f3;
            font-size: 11px;
            line-height: 1.4;
          }
          @media print {
            .container { 
              max-width: none; 
              margin: 0; 
              padding: 15mm; 
            }
            .photo-item { 
              page-break-inside: avoid; 
            }
            .main-table { 
              font-size: 10px; 
            }
          }
          @media (max-width: 768px) {
            .container { padding: 10px; }
            .header { flex-direction: column; text-align: center; }
            .logo-section { margin-right: 0; margin-bottom: 15px; }
            .info-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          
          <div class="header">
            <div class="logo-section">
              <div class="logo-container">
                ${project.logo ? `<img src="${project.logo}" alt="Logo da Empresa" class="company-logo" />` : `LOGO DA<br>EMPRESA<br><small>(Personalizável)</small>`}
              </div>
              <div class="logo-label">EMPRESA</div>
              
              ${project.clientLogo ? `
                <div class="logo-container">
                  <img src="${project.clientLogo}" alt="Logo do Cliente" class="client-logo" />
                </div>
                <div class="logo-label">CLIENTE</div>
              ` : ''}
            </div>
            <div class="title-section">
              <h1 class="main-title">RELATÓRIO DE INSPEÇÃO</h1>
              <div class="subtitle">Sistema de Avaliação de Segurança em Obras</div>
            </div>
          </div>
          
          <div class="creator-info">
            Criado por: ${project.engineer}<br>
            Data de criação: ${currentDateTime}
          </div>
          
          <div class="project-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Projeto:</span> ${project.name}
              </div>
              <div class="info-item">
                <span class="info-label">Local:</span> ${project.location}
              </div>
              <div class="info-item">
                <span class="info-label">Engenheiro:</span> ${project.engineer}
              </div>
              <div class="info-item">
                <span class="info-label">Mestre de Obra:</span> ${project.foreman}
              </div>
              <div class="info-item">
                <span class="info-label">Data Avaliação:</span> ${this.formatDate(project.evaluationDate)}
              </div>
              <div class="info-item">
                <span class="info-label">Relatório Gerado:</span> ${this.formatDate(new Date().toISOString())}
              </div>
            </div>
            ${project.description ? `
              <div class="info-item" style="margin-top: 10px;">
                <span class="info-label">Descrição:</span> ${project.description}
              </div>
            ` : ''}
          </div>
          
          ${mainTable}
          
          ${photographicSection}
          
        </div>
        
        <script>
          window.onload = function() {
            if (window.location.hash !== '#shared') {
              setTimeout(() => {
                if (confirm('Gerar relatório PDF no padrão Rocontec?')) {
                  window.print();
                }
              }, 1000);
            }
          };
        </script>
      </body>
      </html>
    `;
  }

  async generatePDF(project: Project, evaluation: Evaluation): Promise<void> {
    try {
      console.log('🎯 Gerando PDF no formato Rocontec...');
      
      const htmlContent = await this.generateHTMLTemplate(project, evaluation);
      const fileName = `Relatorio_Inspecao_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      if (Platform.OS === 'web') {
        // Web: Download + Nova aba
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nova aba para impressão
        const printWindow = window.open();
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        }
        
        URL.revokeObjectURL(url);
        
        Alert.alert(
          'PDF Rocontec Gerado! 🎉',
          'Relatório criado no padrão oficial:\n\n✅ Layout idêntico ao modelo\n✅ Logo personalizável\n✅ Fotos e status incluídos\n\nUse Ctrl+P para salvar como PDF',
          [{ text: 'Perfeito!' }]
        );
        
      } else {
        // Mobile: Compartilhar
        const shareOptions = {
          title: `Relatório Rocontec - ${project.name}`,
          message: `📋 Relatório de Inspeção de Segurança\n🏗️ Projeto: ${project.name}\n📊 Nota: ${evaluation.percentage.toFixed(1)}%\n\n✅ Formato padrão Rocontec\n📱 Para PDF: abrir no navegador > Imprimir > Salvar como PDF`,
          url: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}#shared`
        };

        const result = await Share.share(shareOptions);
        
        if (result.action === Share.sharedAction) {
          Alert.alert(
            'Relatório Rocontec Compartilhado! 📤',
            'Formato oficial implementado:\n\n✅ Layout idêntico ao modelo\n✅ Tabelas estruturadas\n✅ Seção fotográfica\n✅ Status coloridos\n\nPara PDF: Navegador > Imprimir > Salvar PDF',
            [{ text: 'Excelente!' }]
          );
        }
      }

    } catch (error) {
      console.error('❌ Erro ao gerar relatório Rocontec:', error);
      Alert.alert(
        'Erro no Relatório',
        `Falha na geração:\n${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nTente novamente ou contate o suporte.`
      );
    }
  }
}

export default new PDFService();
