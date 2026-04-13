const translations = {
  en: {
    // Auth
    auth_title: 'Anchr',
    auth_subtitle: 'Stay grounded. Break free.',
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    email_placeholder: 'you@example.com',
    password_placeholder: 'Min 6 characters',
    name_placeholder: 'Your name',
    create_account: 'Create Account',
    please_wait: 'Please wait...',
    or: 'or',
    continue_google: 'Continue with Google',
    signing_in: 'Signing you in...',

    // Navigation
    nav_dashboard: 'Dashboard',
    nav_urge_timer: 'Urge Timer',
    nav_programs: 'Programs',
    nav_habits: 'Habits',
    nav_progress: 'Progress',
    nav_motivation: 'Motivation',
    nav_settings: 'Settings',
    sign_out: 'Sign Out',
    upgrade_title: 'Anchr Pro',
    upgrade_desc: 'Unlock programs, habits, deep insights & more',
    upgrade_btn: 'Upgrade',

    // Dashboard
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    dashboard_subtitle: 'Every moment you choose yourself is a victory',
    set_urge_type: 'Set what you\'re working on',
    whats_your_urge: "What are you working on?",
    need_support: 'Need support right now?',
    having_urge: "I'm having an urge",
    urge_cta_desc: 'Start a guided timer, breathing exercises & coping tools',
    current_streak: 'Current Streak',
    urges_resisted: 'Urges Resisted',
    resist_rate: 'Resist Rate',
    best_streak: 'Best Streak',
    days_strong: 'days strong',
    total: 'total',
    success: 'success',
    days: 'days',
    quick_actions: 'Quick Actions',
    log_a_slip: 'Log a Slip',
    breathing: 'Breathing',
    grounding: 'Grounding',
    progress: 'Progress',
    motivation: 'Motivation',
    your_reminder: 'Your Reminder',
    add_reminder_prompt: 'Add a personal reminder to keep you motivated',
    view_all: 'View all',
    add_one_now: 'Add one now',
    another_one: 'Another one',
    this_week: 'This Week',
    all_resisted: 'All resisted',
    partial_resisted: 'Partial / in progress',
    no_urges: 'No urges',
    chart_numbers_hint: 'Numbers above bars = total urges that day',

    // Urge Timer
    ride_the_wave: 'Ride the Wave',
    urge_timer_subtitle: "Urges are temporary. Let's get through this together.",
    urge_type_label: 'What urge are you dealing with?',
    custom_urge_placeholder: 'Describe your urge...',
    save: 'Save',
    timer_duration: 'Timer Duration',
    whats_happening: "What's happening? (optional)",
    trigger: 'Trigger',
    trigger_placeholder: 'What triggered this?',
    emotion_label: 'Emotion',
    emotion_placeholder: 'How are you feeling?',
    intensity: 'Intensity (1-10)',
    any_notes: 'Any notes...',
    start_timer: 'Start Timer - I Can Do This',
    remaining: 'remaining',
    pause: 'Pause',
    resume: 'Resume',
    timer_tab: 'Timer',
    breathing_tab: 'Breathing',
    grounding_tab: 'Grounding',
    coping_tab: 'Coping',
    focus_countdown: 'Focus on the countdown. Each second is progress.',
    i_resisted: 'I Resisted',
    i_slipped: 'I Slipped',
    you_made_it: 'You made it through',
    timer_complete_desc: 'The timer is up. You stayed strong. How did it go?',
    i_resisted_excl: 'I Resisted!',

    // Breathing
    inhale: 'inhale',
    hold: 'hold',
    exhale: 'exhale',
    breathe_in: 'Breathe in slowly... 4 seconds',
    hold_gently: 'Hold gently... 4 seconds',
    release_slowly: 'Release slowly... 6 seconds',

    // Grounding
    grounding_title: '5-4-3-2-1 Grounding',
    see: 'SEE',
    touch: 'TOUCH',
    hear: 'HEAR',
    smell: 'SMELL',
    taste: 'TASTE',
    see_instruction: 'Name 5 things you can see right now',
    touch_instruction: 'Name 4 things you can touch',
    hear_instruction: 'Name 3 things you can hear',
    smell_instruction: 'Name 2 things you can smell',
    taste_instruction: 'Name 1 thing you can taste',

    // Coping
    do_this_instead: 'Do this instead',
    go_for_walk: 'Go for a walk',
    walk_desc: 'Move your body, change your scenery',
    drink_water: 'Drink water',
    water_desc: 'Hydrate and reset',
    call_someone: 'Call someone',
    call_desc: 'Reach out to a trusted person',
    step_outside: 'Step outside',
    outside_desc: 'Fresh air can shift your state',

    // Urge types
    working_on: 'Working on',
    urge_smoking: 'Smoking',
    urge_drinking: 'Drinking',
    urge_gambling: 'Gambling',
    urge_drugs: 'Drugs',
    urge_overeating: 'Overeating',
    urge_social_media: 'Social Media',
    urge_shopping: 'Shopping',
    urge_pornography: 'Pornography',
    urge_gaming: 'Gaming',
    urge_other: 'Other',

    // Triggers
    stress: 'Stress',
    boredom: 'Boredom',
    loneliness: 'Loneliness',
    location: 'Location',
    social: 'Social',
    tiredness: 'Tiredness',
    habit_loop: 'Habit Loop',
    other: 'Other',

    // Emotions
    anxious: 'Anxious',
    sad: 'Sad',
    angry: 'Angry',
    frustrated: 'Frustrated',
    lonely: 'Lonely',
    restless: 'Restless',
    numb: 'Numb',
    overwhelmed: 'Overwhelmed',

    // Progress
    your_progress: 'Your Progress',
    progress_subtitle: 'Every step forward matters, even the small ones',
    streak: 'Streak',
    resisted: 'Resisted',
    urge_activity: 'Urge Activity',
    week: 'Week',
    month: 'Month',
    no_data_yet: 'No data yet. Start tracking your urges.',
    top_triggers: 'Top Triggers',
    is_top_trigger: 'is your #1 trigger',
    no_trigger_data: 'No trigger data yet',
    peak_times: 'Peak Times',
    most_urges_at: 'Most urges happen around',
    no_time_data: 'No time data yet',
    peak_hour_label: 'Peak hour',
    other_hours_label: 'Other hours',
    recent_urges: 'Recent Urges',
    no_trigger: 'No trigger',
    no_emotion: 'No emotion',
    in_progress_label: 'In Progress',
    no_urges_yet: "No urges tracked yet. That's okay.",
    filter_by_urge: 'Filter by urge',
    all_urges: 'All urges',

    // Motivation Wall
    motivation_wall: 'Motivation Wall',
    motivation_subtitle: 'Your words of strength, always here when you need them',
    add_message: 'Add Message',
    new_motivation: 'New Motivation',
    category: 'Category',
    write_motivation_placeholder: 'Write something to remind yourself why you started...',
    save_message: 'Save Message',
    all: 'All',
    general: 'General',
    why_i_quit: 'Why I Quit',
    self_love: 'Self Love',
    future_self: 'Future Self',
    gratitude: 'Gratitude',
    no_messages_yet: 'No messages yet',
    write_encouragement: 'Write yourself a note of encouragement',

    // Settings
    settings: 'Settings',
    settings_subtitle: 'Manage your preferences and recovery tools',
    what_im_working_on: "What I'm working on",
    profile: 'Profile',
    reminders: 'Reminders',
    check_in_times: 'Check-in Times',
    add_time: '+ Add time',
    active_days: 'Active Days',
    save_reminders: 'Save Reminders',
    saving: 'Saving...',
    saved: 'Saved',
    changes_saved: 'Changes saved',
    recovery_log: 'Recovery Log',
    log_a_slip: 'Log a Slip',
    slip_dialog_desc: "It's okay. Every moment of honesty is strength. Let's understand what happened.",
    log_slip_confirm: 'Log this slip',
    slip_title: "You slipped. Let's reset.",
    slip_desc: "A slip isn't a failure. It's a moment of learning. What happened?",
    what_triggered: 'What triggered it?',
    how_feeling: 'How were you feeling?',
    any_reflections: 'Any reflections...',
    log_reset_streak: 'Log & Reset My Streak',
    recovery_point: 'Recovery point',
    unknown_trigger: 'Unknown trigger',
    unknown_emotion: 'Unknown emotion',
    no_slips: 'No slips recorded. Keep going strong.',
    language: 'Language',

    // Encouragements
    encouragement_1: 'This will pass. You are stronger than this moment.',
    encouragement_2: "Breathe. You've made it through urges before.",
    encouragement_3: 'Every second you wait is a victory.',
    encouragement_4: 'The urge is a wave. Ride it out.',
    encouragement_5: 'You are choosing yourself right now.',
    encouragement_6: 'This feeling is temporary. Your strength is permanent.',

    // Days
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',

    // Privacy & GDPR
    consent_text: 'I agree that Anchr stores my personal data, including habits, urges, and emotional information, to provide the service.',
    consent_required: 'You must agree to the data storage policy to create an account.',
    privacy_policy: 'Privacy Policy',
    open_privacy_policy: 'Read our Privacy Policy',
    data_privacy: 'Data & Privacy',
    export_data: 'Export My Data',
    export_data_desc: 'Download all your data as a JSON file',
    delete_data: 'Delete My Data',
    delete_data_desc: 'Delete all your tracked data (urges, habits, etc.) but keep your account',
    delete_account: 'Delete My Account',
    delete_account_desc: 'Permanently delete your account and all associated data. This cannot be undone.',
    confirm_delete_data: 'This will permanently delete all your tracked data including urges, relapses, habits, and motivations. Your account will remain active. This cannot be undone.',
    confirm_delete_account: 'This will permanently delete your account and all your data. You will be logged out and cannot undo this.',
    type_delete_to_confirm: 'Type DELETE to confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    deleting: 'Deleting...',
    exporting: 'Exporting...',
    privacy_policy_content: `Last updated: April 2026

Anchr ("we", "our", "us") is committed to protecting your privacy. This policy explains what data we collect and how we use it.

Data we collect:
• Account information: name, email address
• Recovery data: urges, triggers, emotions, intensity levels, outcomes
• Habit and program tracking
• Personal motivations and notes
• Usage timestamps

How we use your data:
• To provide the Anchr service and display your progress
• To calculate streaks and statistics
• We never sell your data to third parties
• We never use your data for advertising

Your rights (GDPR):
• Right to access: export all your data as JSON at any time
• Right to erasure: delete your data or account at any time
• Right to rectification: update your information in Settings

Data storage:
Your data is stored securely. Sessions are encrypted and expire after 7 days.

Contact:
For privacy questions, contact us through the app.`,
  },

  da: {
    // Auth
    auth_title: 'Anchr',
    auth_subtitle: 'Hold fast. Bliv fri.',
    sign_in: 'Log ind',
    sign_up: 'Opret konto',
    email: 'E-mail',
    password: 'Adgangskode',
    name: 'Navn',
    email_placeholder: 'dig@eksempel.dk',
    password_placeholder: 'Min. 6 tegn',
    name_placeholder: 'Dit navn',
    create_account: 'Opret konto',
    please_wait: 'Vent venligst...',
    or: 'eller',
    continue_google: 'Fortsæt med Google',
    signing_in: 'Logger dig ind...',

    // Navigation
    nav_dashboard: 'Oversigt',
    nav_urge_timer: 'Trang-timer',
    nav_programs: 'Programmer',
    nav_habits: 'Vaner',
    nav_progress: 'Fremskridt',
    nav_motivation: 'Motivation',
    nav_settings: 'Indstillinger',
    sign_out: 'Log ud',
    upgrade_title: 'Anchr Pro',
    upgrade_desc: 'Lås op for programmer, vaner, dybdegående indsigter & mere',
    upgrade_btn: 'Opgrader',

    // Dashboard
    good_morning: 'Godmorgen',
    good_afternoon: 'God eftermiddag',
    good_evening: 'Godaften',
    dashboard_subtitle: 'Hvert øjeblik du vælger dig selv er en sejr',
    set_urge_type: 'Sæt hvad du arbejder på',
    whats_your_urge: 'Hvad arbejder du på?',
    need_support: 'Har du brug for støtte lige nu?',
    having_urge: 'Jeg har en trang',
    urge_cta_desc: 'Start en guidet timer, åndedrætsøvelser & mestringsværktøjer',
    current_streak: 'Nuværende streak',
    urges_resisted: 'Trang modstået',
    resist_rate: 'Modstandsrate',
    best_streak: 'Bedste streak',
    days_strong: 'dage stærk',
    total: 'i alt',
    success: 'succes',
    days: 'dage',
    quick_actions: 'Hurtige handlinger',
    log_a_slip: 'Log et slip',
    breathing: 'Åndedræt',
    grounding: 'Grounding',
    progress: 'Fremskridt',
    motivation: 'Motivation',
    your_reminder: 'Din påmindelse',
    add_reminder_prompt: 'Tilføj en personlig påmindelse for at holde dig motiveret',
    view_all: 'Se alle',
    add_one_now: 'Tilføj en nu',
    another_one: 'En ny',
    this_week: 'Denne uge',
    all_resisted: 'Alle modstået',
    partial_resisted: 'Delvis / i gang',
    no_urges: 'Ingen trang',
    chart_numbers_hint: 'Tal over søjler = samlet trang den dag',

    // Urge Timer
    ride_the_wave: 'Rid bølgen',
    urge_timer_subtitle: 'Trang er midlertidig. Lad os komme igennem det sammen.',
    urge_type_label: 'Hvilken trang har du?',
    custom_urge_placeholder: 'Beskriv din trang...',
    save: 'Gem',
    timer_duration: 'Timer-varighed',
    whats_happening: 'Hvad sker der? (valgfrit)',
    trigger: 'Udløser',
    trigger_placeholder: 'Hvad udløste det?',
    emotion_label: 'Følelse',
    emotion_placeholder: 'Hvordan har du det?',
    intensity: 'Intensitet (1-10)',
    any_notes: 'Eventuelle noter...',
    start_timer: 'Start timer - Jeg kan gøre det!',
    remaining: 'tilbage',
    pause: 'Pause',
    resume: 'Genoptag',
    timer_tab: 'Timer',
    breathing_tab: 'Åndedræt',
    grounding_tab: 'Grounding',
    coping_tab: 'Mestring',
    focus_countdown: 'Fokusér på nedtællingen. Hvert sekund er fremskridt.',
    i_resisted: 'Jeg modstod',
    i_slipped: 'Jeg faldt i',
    you_made_it: 'Du klarede det',
    timer_complete_desc: 'Tiden er udløbet. Du var stærk. Hvordan gik det?',
    i_resisted_excl: 'Jeg modstod!',

    // Breathing
    inhale: 'indånd',
    hold: 'hold',
    exhale: 'udånd',
    breathe_in: 'Ånd langsomt ind... 4 sekunder',
    hold_gently: 'Hold forsigtigt... 4 sekunder',
    release_slowly: 'Slip langsomt ud... 6 sekunder',

    // Grounding
    grounding_title: '5-4-3-2-1 Grounding',
    see: 'SE',
    touch: 'RØR',
    hear: 'HØR',
    smell: 'LUGT',
    taste: 'SMAG',
    see_instruction: 'Nævn 5 ting du kan se lige nu',
    touch_instruction: 'Nævn 4 ting du kan røre',
    hear_instruction: 'Nævn 3 ting du kan høre',
    smell_instruction: 'Nævn 2 ting du kan lugte',
    taste_instruction: 'Nævn 1 ting du kan smage',

    // Coping
    do_this_instead: 'Gør dette i stedet',
    go_for_walk: 'Gå en tur',
    walk_desc: 'Bevæg din krop, skift omgivelser',
    drink_water: 'Drik vand',
    water_desc: 'Hydrér og nulstil',
    call_someone: 'Ring til nogen',
    call_desc: 'Ræk ud til en person du stoler på',
    step_outside: 'Gå udenfor',
    outside_desc: 'Frisk luft kan ændre din tilstand',

    // Urge types
    working_on: 'Arbejder på',
    urge_smoking: 'Rygning',
    urge_drinking: 'Alkohol',
    urge_gambling: 'Gambling',
    urge_drugs: 'Stoffer',
    urge_overeating: 'Overspisning',
    urge_social_media: 'Sociale medier',
    urge_shopping: 'Shopping',
    urge_pornography: 'Pornografi',
    urge_gaming: 'Gaming',
    urge_other: 'Andet',

    // Triggers
    stress: 'Stress',
    boredom: 'Kedsomhed',
    loneliness: 'Ensomhed',
    location: 'Sted',
    social: 'Socialt',
    tiredness: 'Træthed',
    habit_loop: 'Vane-loop',
    other: 'Andet',

    // Emotions
    anxious: 'Angst',
    sad: 'Trist',
    angry: 'Vred',
    frustrated: 'Frustreret',
    lonely: 'Ensom',
    restless: 'Rastløs',
    numb: 'Følelsesløs',
    overwhelmed: 'Overvældet',

    // Progress
    your_progress: 'Dine fremskridt',
    progress_subtitle: 'Hvert skridt fremad tæller, selv de små',
    streak: 'Streak',
    resisted: 'Modstået',
    urge_activity: 'Trang-aktivitet',
    week: 'Uge',
    month: 'Måned',
    no_data_yet: 'Ingen data endnu. Begynd at registrere din trang.',
    top_triggers: 'Top udløsere',
    is_top_trigger: 'er din #1 udløser',
    no_trigger_data: 'Ingen udløser-data endnu',
    peak_times: 'Spidstider',
    most_urges_at: 'Den stærkeste trang sker omkring',
    no_time_data: 'Ingen tidsdata endnu',
    peak_hour_label: 'Spidstime',
    other_hours_label: 'Andre timer',
    recent_urges: 'Seneste trang',
    no_trigger: 'Ingen udløser',
    no_emotion: 'Ingen følelse',
    in_progress_label: 'I gang',
    no_urges_yet: 'Ingen trang registreret endnu. Det er helt okay.',
    filter_by_urge: 'Filtrer efter trang',
    all_urges: 'Al trang',

    // Motivation Wall
    motivation_wall: 'Motivationsvæg',
    motivation_subtitle: 'Dine ord af styrke, altid her når du har brug for dem',
    add_message: 'Tilføj besked',
    new_motivation: 'Ny motivation',
    category: 'Kategori',
    write_motivation_placeholder: 'Skriv noget for at minde dig selv om hvorfor du startede...',
    save_message: 'Gem besked',
    all: 'Alle',
    general: 'Generelt',
    why_i_quit: 'Hvorfor jeg stoppede',
    self_love: 'Selvkærlighed',
    future_self: 'Fremtidige mig',
    gratitude: 'Taknemmelighed',
    no_messages_yet: 'Ingen beskeder endnu',
    write_encouragement: 'Skriv dig selv en opmuntrende note',

    // Settings
    settings: 'Indstillinger',
    settings_subtitle: 'Administrer dine præferencer og genopretningsværktøjer',
    what_im_working_on: 'Hvad jeg arbejder på',
    profile: 'Profil',
    reminders: 'Påmindelser',
    check_in_times: 'Check-in tider',
    add_time: '+ Tilføj tid',
    active_days: 'Aktive dage',
    save_reminders: 'Gem påmindelser',
    saving: 'Gemmer...',
    saved: 'Gemt',
    changes_saved: 'Ændringer gemt',
    recovery_log: 'Genopretningslog',
    log_a_slip: 'Log et fald',
    slip_dialog_desc: 'Det er okay. Hvert øjeblik af ærlighed er styrke. Lad os forstå hvad der skete.',
    log_slip_confirm: 'Log dette fald',
    slip_title: 'Du gled. Lad os nulstille.',
    slip_desc: 'Et fald er ikke et nederlag. Det er et øjeblik af læring. Hvad skete der?',
    what_triggered: 'Hvad udløste det?',
    how_feeling: 'Hvordan havde du det?',
    any_reflections: 'Eventuelle refleksioner...',
    log_reset_streak: 'Log & nulstil min streak',
    recovery_point: 'Genopretningspunkt',
    unknown_trigger: 'Ukendt udløser',
    unknown_emotion: 'Ukendt følelse',
    no_slips: 'Ingen fald registreret. Bliv ved den gode stil.',
    language: 'Sprog',

    // Encouragements
    encouragement_1: 'Det går over. Du er stærkere end dette øjeblik.',
    encouragement_2: 'Ånd. Du har klaret trang før.',
    encouragement_3: 'Hvert sekund du venter er en sejr.',
    encouragement_4: 'Trangen er en bølge. Rid den ud.',
    encouragement_5: 'Du vælger dig selv lige nu.',
    encouragement_6: 'Denne følelse er midlertidig. Din styrke er permanent.',

    // Days
    mon: 'Man',
    tue: 'Tir',
    wed: 'Ons',
    thu: 'Tor',
    fri: 'Fre',
    sat: 'Lør',
    sun: 'Søn',

    // Privacy & GDPR
    consent_text: 'Jeg accepterer, at Anchr gemmer mine personlige data, herunder vaner, trang og følelsesmæssige oplysninger, for at levere tjenesten.',
    consent_required: 'Du skal acceptere datapolitikken for at oprette en konto.',
    privacy_policy: 'Privatlivspolitik',
    open_privacy_policy: 'Læs vores Privatlivspolitik',
    data_privacy: 'Data & Privatliv',
    export_data: 'Eksportér mine data',
    export_data_desc: 'Download alle dine data som en JSON-fil',
    delete_data: 'Slet mine data',
    delete_data_desc: 'Slet alle dine registrerede data (trang, vaner osv.), men behold din konto',
    delete_account: 'Slet min konto',
    delete_account_desc: 'Slet permanent din konto og alle tilknyttede data. Dette kan ikke fortrydes.',
    confirm_delete_data: 'Dette vil permanent slette alle dine registrerede data, herunder trang, fald, vaner og motivationer. Din konto forbliver aktiv. Dette kan ikke fortrydes.',
    confirm_delete_account: 'Dette vil permanent slette din konto og alle dine data. Du vil blive logget ud og kan ikke fortryde dette.',
    type_delete_to_confirm: 'Skriv SLET for at bekræfte',
    cancel: 'Annuller',
    delete: 'Slet',
    deleting: 'Sletter...',
    exporting: 'Eksporterer...',
    privacy_policy_content: `Sidst opdateret: April 2026

Anchr ("vi", "os") er forpligtet til at beskytte dit privatliv. Denne politik forklarer, hvilke data vi indsamler og hvordan vi bruger dem.

Data vi indsamler:
• Kontooplysninger: navn, e-mailadresse
• Genopretningsdata: trang, udløsere, følelser, intensitetsniveauer, resultater
• Vane- og programsporing
• Personlige motivationer og noter
• Tidsstempler for brug

Sådan bruger vi dine data:
• For at levere Anchr-tjenesten og vise dine fremskridt
• For at beregne streaks og statistikker
• Vi sælger aldrig dine data til tredjeparter
• Vi bruger aldrig dine data til reklame

Dine rettigheder (GDPR):
• Ret til indsigt: eksportér alle dine data som JSON til enhver tid
• Ret til sletning: slet dine data eller konto til enhver tid
• Ret til berigtigelse: opdatér dine oplysninger i Indstillinger

Datalagring:
Dine data opbevares sikkert. Sessioner er krypterede og udløber efter 7 dage.

Kontakt:
For spørgsmål om privatliv, kontakt os via appen.`,
  }
};

export default translations;
