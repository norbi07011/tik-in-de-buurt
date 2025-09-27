import type { Freelancer, Business, CV } from '../src/types';
import type { TFunction } from 'i18next';

type CvEntity = (Freelancer | Business) & { cv: NonNullable<(Freelancer | Business)['cv']> };
type CvTemplate = 'classic' | 'modern' | 'ats';

export const generateCvHtml = (entity: CvEntity, t: TFunction, template: CvTemplate = 'classic'): string => {
    const { cv } = entity;
    const name = 'nameKey' in entity ? t(entity.nameKey) : 'User';
    const title = 'specializationKey' in entity ? t(entity.specializationKey) : t(entity.categoryKey);
    const profileImageUrl = 'profileImageUrl' in entity ? entity.profileImageUrl : entity.logoUrl;

    const styles = {
        classic: `
            body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 20px auto; padding: 40px; background: #fff; border-top: 5px solid #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 2.5em; }
            .header p { margin: 5px 0; font-size: 1.1em; color: #555; }
            .section h2 { font-size: 1.4em; color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
            .item { margin-bottom: 15px; }
            .item h3 { margin: 0; font-size: 1.1em; }
            .item .sub-header { display: flex; justify-content: space-between; font-size: 0.9em; color: #555; font-style: italic; margin-bottom: 5px; }
            .tech-stack { margin-top: 5px; }
            .tech-stack span { display: inline-block; background: #eee; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin: 2px; }
            ul { padding-left: 20px; }
        `,
        modern: `
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #444; background: #f4f4f4; }
            .container { max-width: 800px; margin: 20px auto; padding: 0; background: #fff; display: flex; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .sidebar { width: 35%; background: #2c3e50; color: #ecf0f1; padding: 30px; }
            .main { width: 65%; padding: 30px; }
            .sidebar img { width: 120px; height: 120px; border-radius: 50%; display: block; margin: 0 auto 20px; border: 4px solid #3498db; }
            .sidebar h2 { color: #3498db; text-align: center; }
            .header h1 { margin: 0; font-size: 2.8em; color: #2c3e50; }
            .header p { font-size: 1.2em; color: #3498db; margin: 0; }
            .section h2 { font-size: 1.2em; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px; }
        `,
         ats: `
            body { font-family: Arial, sans-serif; line-height: 1.4; color: #000; font-size: 11pt; }
            .container { max-width: 800px; margin: 20px auto; padding: 20px; background: #fff; }
            .header h1 { margin: 0; font-size: 1.8em; }
            .header p { margin: 0; }
            .section { margin-top: 15px; }
            .section h2 { font-size: 1.2em; border-bottom: 1px solid #000; padding-bottom: 2px; margin: 0 0 8px 0; text-transform: uppercase; }
            .item { margin-bottom: 10px; }
            .item h3 { margin: 0; font-size: 1em; font-weight: bold; }
            .item .sub-header { display: flex; justify-content: space-between; font-size: 0.9em; }
            ul { margin: 5px 0; padding-left: 18px; }
        `,
    };

    const currentStyle = styles[template] || styles.classic;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${currentStyle}</style>
            <title>CV: ${name}</title>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${name}</h1>
                    <p>${title}</p>
                </div>
                <div class="section">
                    <h2>${t('cv_summary')}</h2>
                    <p>${cv.summary}</p>
                </div>
                <div class="section">
                    <h2>${t('cv_experience')}</h2>
                    ${cv.experience.map(exp => `
                        <div class="item">
                            <h3>${exp.job_title}</h3>
                            <div class="sub-header">
                                <span>${exp.company}, ${exp.location}</span>
                                <span>${exp.start_date} - ${exp.is_current ? t('present') : exp.end_date}</span>
                            </div>
                            <p>${exp.description}</p>
                            ${exp.achievements.length > 0 ? `<ul>${exp.achievements.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
                            ${exp.tech_stack.length > 0 ? `<div class="tech-stack">${exp.tech_stack.map(t => `<span>${t}</span>`).join('')}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                 <div class="section">
                    <h2>${t('cv_education')}</h2>
                    ${cv.education.map(edu => `
                        <div class="item">
                           <h3>${edu.degree}</h3>
                           <div class="sub-header">
                                <span>${edu.institution}</span>
                                <span>${edu.start_date} - ${edu.end_date}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="section">
                    <h2>${t('cv_skills')}</h2>
                    <p>${cv.skills.join(', ')}</p>
                </div>
                <div class="section">
                    <h2>${t('cv_languages')}</h2>
                     <ul>
                        ${cv.languages.map(lang => `<li>${lang.language}: ${lang.proficiency}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `;
};
