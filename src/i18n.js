const T = {
  // Sidebar sections
  'обучение':           { en: 'learning',       fr: 'apprentissage'  },
  'общение':            { en: 'communication',  fr: 'communication'  },
  'аккаунт':            { en: 'account',        fr: 'compte'         },
  'работа':             { en: 'work',           fr: 'travail'        },
  'обзор':              { en: 'overview',       fr: 'aperçu'         },
  'люди':               { en: 'people',         fr: 'personnes'      },
  'финансы':            { en: 'finances',       fr: 'finances'       },
  'система':            { en: 'system',         fr: 'système'        },

  // Sidebar nav items
  'Главная':            { en: 'Home',           fr: 'Accueil'        },
  'Расписание':         { en: 'Schedule',       fr: 'Planning'       },
  'Домашние задания':   { en: 'Homework',       fr: 'Devoirs'        },
  'Сообщения':          { en: 'Messages',       fr: 'Messages'       },
  'Преподаватели':      { en: 'Teachers',       fr: 'Professeurs'    },
  'Абонементы':         { en: 'Subscriptions',  fr: 'Abonnements'    },
  'Профиль':            { en: 'Profile',        fr: 'Profil'         },
  'Мои ученики':        { en: 'My students',    fr: 'Mes élèves'     },
  'Материалы':          { en: 'Materials',      fr: 'Matériaux'      },
  'Доход':              { en: 'Earnings',       fr: 'Revenus'        },
  'Дашборд':            { en: 'Dashboard',      fr: 'Tableau de bord'},
  'Ученики':            { en: 'Students',       fr: 'Élèves'         },
  'Роли и доступ':      { en: 'Roles & access', fr: 'Rôles & accès'  },
  'Заявки':             { en: 'Leads',          fr: 'Demandes'       },
  'Финансы':            { en: 'Finances',       fr: 'Finances'       },
  'Отчёты':             { en: 'Reports',        fr: 'Rapports'       },
  'Курсы и языки':      { en: 'Courses',        fr: 'Cours & langues'},
  'Настройки':          { en: 'Settings',       fr: 'Paramètres'     },

  // TopBar search
  'Поиск по порталу…':  { en: 'Search…',        fr: 'Rechercher…'    },
  'Раздел':             { en: 'Section',         fr: 'Section'        },
  'ДЗ · до пт':         { en: 'HW · by Fri',    fr: 'DV · ven.'      },
  'ДЗ · до ср':         { en: 'HW · by Wed',    fr: 'DV · mer.'      },
  'ДЗ · Сдано':         { en: 'HW · Submitted', fr: 'DV · Rendu'     },
  'Абонемент · активный':         { en: 'Subscription · active', fr: 'Abonnement · actif' },
  'Преподаватель · Французский':  { en: 'Teacher · French',   fr: 'Professeur · Français'  },
  'Преподаватель · Английский':   { en: 'Teacher · English',  fr: 'Professeur · Anglais'   },
  'Носитель · Французский':       { en: 'Native · French',    fr: 'Natif · Français'       },
  'Преподаватель · Испанский':    { en: 'Teacher · Spanish',  fr: 'Professeur · Espagnol'  },
  'Преподаватель · Немецкий':     { en: 'Teacher · German',   fr: 'Professeur · Allemand'  },

  // User subtitles
  'Ученик · французский B1':       { en: 'Student · French B1',      fr: 'Élève · Français B1'        },
  'Преподаватель · фр, англ':      { en: 'Teacher · FR, EN',          fr: 'Professeur · FR, EN'        },
  'Родитель · Анна Соколова':      { en: 'Parent · Anna Sokolova',    fr: 'Parent · Anna Sokolova'     },
  'Администратор · Post Scriptum': { en: 'Admin · Post Scriptum',     fr: 'Admin · Post Scriptum'      },

  // Sidebar bottom
  'Нужна помощь?':      { en: 'Need help?',     fr: 'Besoin d\'aide ?'},
  'Напишите менеджеру': { en: 'Contact manager',fr: 'Écrivez au manager'},

  // Common
  'Выйти':              { en: 'Log out',        fr: 'Déconnexion'    },
  'Сохранить':          { en: 'Save',           fr: 'Enregistrer'    },
  'Сохранено':          { en: 'Saved',          fr: 'Enregistré'     },
  'Сменить фото':       { en: 'Change photo',   fr: 'Changer photo'  },
  'Удалить фото':       { en: 'Remove photo',   fr: 'Supprimer photo'},
  'Отмена':             { en: 'Cancel',         fr: 'Annuler'        },
  'ч':                  { en: 'h',              fr: 'h'              },

  // Profile sections
  'аккаунт':            { en: 'account',        fr: 'compte'         },
  'настройки':          { en: 'settings',       fr: 'paramètres'     },
  'безопасность':       { en: 'security',       fr: 'sécurité'       },
  'Личные данные':      { en: 'Personal info',  fr: 'Informations'   },
  'Уведомления':        { en: 'Notifications',  fr: 'Notifications'  },
  'Безопасность':       { en: 'Security',       fr: 'Sécurité'       },
  'Смена пароля':       { en: 'Change password',fr: 'Changer de mdp' },
  'Сменить пароль':     { en: 'Change password',fr: 'Changer le mdp' },

  // Profile fields
  'Ученик':             { en: 'Student',        fr: 'Élève'          },
  'Имя и фамилия':      { en: 'Full name',      fr: 'Nom complet'    },
  'Телефон':            { en: 'Phone',          fr: 'Téléphone'      },
  'Часовой пояс':       { en: 'Timezone',       fr: 'Fuseau horaire' },
  'Язык интерфейса':    { en: 'Language',       fr: 'Langue'         },

  // Notifications
  'Email-уведомления':  { en: 'Email notifications', fr: 'Notif. email'   },
  'Push-уведомления':   { en: 'Push notifications',  fr: 'Notif. push'    },
  'SMS-уведомления':    { en: 'SMS notifications',   fr: 'SMS'            },
  'Напоминание об уроке (за сколько часов)': { en: 'Lesson reminder (hours before)', fr: 'Rappel de cours (heures avant)' },

  // Security
  'Текущий пароль':     { en: 'Current password',    fr: 'Mot de passe actuel'   },
  'Новый пароль':       { en: 'New password',         fr: 'Nouveau mot de passe'  },
  'Повторите новый пароль': { en: 'Repeat new password', fr: 'Répétez le mot de passe' },
  'Пароли не совпадают':    { en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },
  'После смены пароля вы будете автоматически выйдены из всех устройств':
    { en: 'After changing your password you will be signed out of all devices',
      fr: 'Après avoir changé votre mot de passe, vous serez déconnecté de tous les appareils' },

  // DashboardPage — RoleSwitcher
  'Преподаватель':      { en: 'Teacher',        fr: 'Professeur'     },
  'Родитель':           { en: 'Parent',         fr: 'Parent'         },
  'Админ':              { en: 'Admin',          fr: 'Admin'          },

  // DashboardPage — Student
  'Ваш следующий урок': { en: 'Your next lesson',     fr: 'Votre prochain cours'  },
  'Войти в Zoom':       { en: 'Join Zoom',            fr: 'Rejoindre Zoom'        },
  'Подготовиться':      { en: 'Prepare',              fr: 'Se préparer'           },
  'Серия занятий':      { en: 'Streak',               fr: 'Série de cours'        },
  'Абонемент':          { en: 'Subscription',         fr: 'Abonnement'            },
  'Продлить':           { en: 'Renew',                fr: 'Renouveler'            },
  'мои курсы':          { en: 'my courses',           fr: 'mes cours'             },
  'Все курсы':          { en: 'All courses',          fr: 'Tous les cours'        },
  'домашка на эту неделю': { en: 'homework this week', fr: 'devoirs cette semaine' },
  'эта неделя':         { en: 'this week',            fr: 'cette semaine'         },
  'Календарь':          { en: 'Calendar',             fr: 'Calendrier'            },

  // DashboardPage — Teacher
  'Уроков на неделе':   { en: 'Lessons this week',    fr: 'Cours cette semaine'   },
  'Активных учеников':  { en: 'Active students',      fr: 'Élèves actifs'         },
  'Средняя оценка':     { en: 'Avg. rating',          fr: 'Note moyenne'          },
  'Доход за месяц':     { en: 'Monthly income',       fr: 'Revenu mensuel'        },
  'Все':                { en: 'All',                  fr: 'Tous'                  },
  'Новый слот':         { en: 'New slot',             fr: 'Nouveau créneau'       },
  'Завершён':           { en: 'Done',                 fr: 'Terminé'               },
  'Сейчас':             { en: 'Now',                  fr: 'En cours'              },
  'Запланирован':       { en: 'Scheduled',            fr: 'Planifié'              },
  'В эфир':             { en: 'Go live',              fr: 'En direct'             },
  'Требует внимания':   { en: 'Needs attention',      fr: 'Nécessite attention'   },
  'нагрузка':           { en: 'workload',             fr: 'charge de travail'     },
  'На этой неделе':     { en: 'This week',            fr: 'Cette semaine'         },
  'Всего часов':        { en: 'Total hours',          fr: 'Total d\'heures'       },
  'Сегодня':            { en: 'Today',                fr: 'Aujourd\'hui'          },

  // HomeworkPage — tabs & states
  'Новые':              { en: 'New',                  fr: 'Nouveaux'              },
  'В работе':           { en: 'In progress',          fr: 'En cours'              },
  'Сдано':              { en: 'Submitted',            fr: 'Rendu'                 },
  'Просрочено':         { en: 'Overdue',              fr: 'En retard'             },
  'Не начато':          { en: 'Not started',          fr: 'Non commencé'          },

  // HomeworkPage — KPI labels
  'Всего заданий':      { en: 'Total assignments',    fr: 'Devoirs au total'      },
  'Просрочено':         { en: 'Overdue',              fr: 'En retard'             },

  // HomeworkPage — expanded row labels
  'Срок сдачи: ':       { en: 'Due: ',                fr: 'Échéance : '           },
  'Курс: ':             { en: 'Course: ',             fr: 'Cours : '              },
  'Преподаватель: ':    { en: 'Teacher: ',            fr: 'Professeur : '         },
  'Срок сдачи истёк — сдайте как можно скорее или напишите преподавателю':
    { en: 'Deadline passed — submit as soon as possible or contact your teacher',
      fr: 'Délai dépassé — rendez le travail dès que possible ou écrivez à votre professeur' },

  // HomeworkPage — buttons
  'Сдать задание':      { en: 'Submit assignment',    fr: 'Rendre le devoir'      },
  'Просмотреть работу': { en: 'View submission',      fr: 'Voir le rendu'         },
  'Написать преподавателю': { en: 'Message teacher',  fr: 'Écrire au professeur'  },

  // HomeworkPage — modal
  'сдать задание':      { en: 'submit assignment',    fr: 'rendre le devoir'      },
  'Комментарий к работе': { en: 'Comment on work',   fr: 'Commentaire sur le travail' },
  'Напишите что сделали, какие были трудности...':
    { en: 'Describe what you did, any difficulties...',
      fr: 'Décrivez ce que vous avez fait, les difficultés...' },
  'Ссылка на работу (Google Docs, Notion...)':
    { en: 'Link to work (Google Docs, Notion...)',
      fr: 'Lien vers le travail (Google Docs, Notion...)' },
  'Отправить на проверку': { en: 'Submit for review', fr: 'Soumettre pour correction' },

  // HomeworkPage — right panel eyebrows
  'прогресс':           { en: 'progress',             fr: 'progression'           },
  'дедлайны':           { en: 'deadlines',            fr: 'échéances'             },
  'Скоро сдавать':      { en: 'Coming up',            fr: 'À rendre bientôt'      },
  'оценки':             { en: 'grades',               fr: 'notes'                 },
  'Последние':          { en: 'Recent',               fr: 'Récentes'              },
  'Заданий в этой категории нет': { en: 'No assignments in this category', fr: 'Aucun devoir dans cette catégorie' },
  'выполнено':          { en: 'completed',            fr: 'complété'              },

  // MessagesPage
  'Чаты':               { en: 'Chats',                fr: 'Discussions'           },
  'Поиск...':           { en: 'Search...',            fr: 'Rechercher...'         },
  'Онлайн':             { en: 'Online',               fr: 'En ligne'              },
  'Был(а) недавно':     { en: 'Recently active',      fr: 'Récemment actif(ve)'   },
  'Записаться':         { en: 'Book',                 fr: 'Réserver'              },
  'Написать сообщение...': { en: 'Write a message...', fr: 'Écrire un message...' },
  'Ничего не найдено':  { en: 'Nothing found',        fr: 'Rien trouvé'           },

  // CalendarPage
  'Сегодня':            { en: 'Today',                fr: 'Aujourd\'hui'          },
  'выберите день':      { en: 'select a day',         fr: 'choisissez un jour'    },
  'Нет уроков':         { en: 'No lessons',           fr: 'Pas de cours'          },
  'В этот день занятий нет': { en: 'No lessons on this day', fr: 'Pas de cours ce jour' },
  'история':            { en: 'history',              fr: 'historique'            },
  'Посещаемость':       { en: 'Attendance',           fr: 'Assiduité'             },
  'Проведено':          { en: 'Completed',            fr: 'Terminés'              },
  'Пропуск':            { en: 'Missed',               fr: 'Manqué'                },
  'Впереди':            { en: 'Upcoming',             fr: 'À venir'               },
  'Пропущено':          { en: 'Missed',               fr: 'Manqués'               },
  'Запланировано':      { en: 'Scheduled',            fr: 'Planifiés'             },
  'Новый урок':         { en: 'New lesson',           fr: 'Nouveau cours'         },

  // CalendarPage — STATE_LABEL
  'Пропущен':           { en: 'Missed',               fr: 'Manqué'                },

  // CalendarPage admin
  'Занятия':            { en: 'Lessons',              fr: 'Cours'                 },
  '+ Оплаты':           { en: '+ Payments',           fr: '+ Paiements'           },
  'Занятий в мае':      { en: 'Lessons in May',       fr: 'Cours en mai'          },
  'Выручка':            { en: 'Revenue',              fr: 'Chiffre d\'affaires'   },
  'Оплачено':           { en: 'Paid',                 fr: 'Payé'                  },
  'Ожидает':            { en: 'Pending',              fr: 'En attente'            },
  'Уроков':             { en: 'Lessons',              fr: 'Cours'                 },
  'День в цифрах':      { en: 'Day in numbers',       fr: 'Le jour en chiffres'   },
  'Отчёт':              { en: 'Report',               fr: 'Rapport'               },

  // TeachersPage
  'Мой преподаватель':  { en: 'My teacher',           fr: 'Mon professeur'        },
  'Носитель языка':     { en: 'Native speaker',       fr: 'Locuteur natif'        },
  'Мои преподаватели':  { en: 'My teachers',          fr: 'Mes professeurs'       },
  'Носители языка':     { en: 'Native speakers',      fr: 'Locuteurs natifs'      },
  'Средний рейтинг':    { en: 'Avg. rating',          fr: 'Note moyenne'          },
  'Преподавателей':     { en: 'Teachers',             fr: 'Professeurs'           },
  'активные курсы':     { en: 'active courses',       fr: 'cours actifs'          },
  'в школе':            { en: 'in the school',        fr: 'dans l\'école'         },
  'из 5':               { en: 'out of 5',             fr: 'sur 5'                 },
  'всего в школе':      { en: 'total in school',      fr: 'total à l\'école'      },
  'Только мои':         { en: 'Mine only',            fr: 'Les miens seulement'   },
  'Преподавателей по этому фильтру не найдено':
    { en: 'No teachers match this filter',
      fr: 'Aucun professeur ne correspond à ce filtre' },
  'о преподавателе':    { en: 'about teacher',        fr: 'à propos du professeur'},
  'языки':              { en: 'languages',            fr: 'langues'               },
  'специализация':      { en: 'specialisation',       fr: 'spécialisation'        },
  'Следующий урок':     { en: 'Next lesson',          fr: 'Prochain cours'        },
  'Войти':              { en: 'Join',                 fr: 'Rejoindre'             },
  'Записаться на урок': { en: 'Book a lesson',        fr: 'Réserver un cours'     },
  'Написать сообщение': { en: 'Send message',         fr: 'Envoyer un message'    },
  'Рейтинг':            { en: 'Rating',               fr: 'Note'                  },
  'Отзывы':             { en: 'Reviews',              fr: 'Avis'                  },
  'Опыт':               { en: 'Experience',           fr: 'Expérience'            },
  'отзывов':            { en: 'reviews',              fr: 'avis'                  },
  'учеников':           { en: 'students',             fr: 'élèves'                },

  // SubscriptionsPage
  'Активный':           { en: 'Active',               fr: 'Actif'                 },
  'Использовано уроков':{ en: 'Lessons used',         fr: 'Cours utilisés'        },
  'уроков осталось':    { en: 'lessons remaining',    fr: 'cours restants'        },
  'Истекает':           { en: 'Expires',              fr: 'Expire'                },
  'Активных абонементов': { en: 'Active subscriptions', fr: 'Abonnements actifs'  },
  'Уроков осталось':    { en: 'Lessons remaining',    fr: 'Cours restants'        },
  'Ближайшее истечение':{ en: 'Nearest expiry',       fr: 'Prochaine expiration'  },
  'Потрачено всего':    { en: 'Total spent',          fr: 'Total dépensé'         },
  'сейчас':             { en: 'now',                  fr: 'maintenant'            },
  'по всем курсам':     { en: 'across all courses',   fr: 'tous cours confondus'  },
  'за всё время':       { en: 'all time',             fr: 'depuis le début'       },
  'текущие':            { en: 'current',              fr: 'en cours'              },
  'Активные абонементы':{ en: 'Active subscriptions', fr: 'Abonnements actifs'    },
  'история':            { en: 'history',              fr: 'historique'            },
  'Прошлые платежи':    { en: 'Past payments',        fr: 'Paiements passés'      },
  'покупка':            { en: 'purchase',             fr: 'achat'                 },
  'Новый абонемент':    { en: 'New subscription',     fr: 'Nouvel abonnement'     },
  'Язык':               { en: 'Language',             fr: 'Langue'                },
  'Популярный':         { en: 'Popular',              fr: 'Populaire'             },
  'Купить':             { en: 'Buy',                  fr: 'Acheter'               },
  'Оплатить':           { en: 'Pay',                  fr: 'Payer'                 },
  'оформление абонемента': { en: 'subscription checkout', fr: 'achat d\'abonnement' },
  'Действует 30 дней':  { en: 'Valid for 30 days',    fr: 'Valable 30 jours'      },
  'Способ оплаты':      { en: 'Payment method',       fr: 'Mode de paiement'      },
  'Нажимая «Оплатить», вы соглашаетесь с офертой. Возврат в течение 14 дней.':
    { en: 'By clicking "Pay" you agree to the terms. Refund within 14 days.',
      fr: 'En cliquant sur « Payer », vous acceptez les conditions. Remboursement sous 14 jours.' },
  'Оплата картой или СБП. Абонемент действует 30 дней с момента покупки.':
    { en: 'Pay by card or SBP. Subscription is valid for 30 days from purchase.',
      fr: 'Paiement par carte ou virement. L\'abonnement est valable 30 jours à partir de l\'achat.' },
}

export function translate(key, locale) {
  if (!locale || locale === 'ru') return key
  return T[key]?.[locale] ?? key
}
