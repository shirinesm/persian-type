# تایپ پارسی

تمرین تایپ فارسی به سبک monkeytype با متن‌هایی از ادبیات فارسی: حافظ، سعدی، فردوسی، مولوی، خیام، رودکی، باباطاهر، صادق هدایت و نیما یوشیج.

- حالت زمانی (۱۵/۳۰/۶۰ ثانیه) و حالت متن (کوتاه/متوسط/بلند)
- سرعت (نویسه÷۵ در دقیقه) و دقت؛ نمایش نام شاعر و منبع پس از هر آزمون
- پذیرش ی/ک عربی، و فاصله به جای نیم‌فاصله
- Tab یا Enter برای شروع دوباره

متن‌های کلاسیک با گنجور (ganjoor.net) مقابله شده‌اند. سایت کاملاً ایستا است (HTML/CSS/JS) و فونت وزیرمتن (OFL) همراه آن است.

## English mode / حالت انگلیسی
A language toggle (فارسی / English) in the header switches the whole interface (direction, labels, results) and the text pool. The choice is remembered in `localStorage` and can be set by URL: `?lang=en` or `?lang=fa`.

English passages (24) come from English-language literature and philosophy, all in the public domain. Each one is quoted exactly from its Project Gutenberg edition (original spelling and punctuation kept, e.g. Hobbes’s “poore”). `python3 tools/verify_en.py` downloads the editions and checks that every passage is an exact substring. While typing, plain `'` `"` `-` are accepted for the typographic ’ “ ” — marks. WPM uses the standard 5 characters = 1 word. English text is set in Inter (SIL OFL, `fonts/OFL-Inter.txt`).

| Author | Work | Gutenberg |
|---|---|---|
| William Shakespeare | Hamlet, Act III, Scene 1 | [#1524](https://www.gutenberg.org/ebooks/1524) |
| William Shakespeare | As You Like It, Act II, Scene 7 | [#1523](https://www.gutenberg.org/ebooks/1523) |
| William Shakespeare | Sonnet 18 | [#1041](https://www.gutenberg.org/ebooks/1041) |
| William Shakespeare | Macbeth, Act V, Scene 5 | [#1533](https://www.gutenberg.org/ebooks/1533) |
| William Shakespeare | Julius Caesar, Act II, Scene 2 | [#1522](https://www.gutenberg.org/ebooks/1522) |
| Jane Austen | Pride and Prejudice, Chapter 1 | [#1342](https://www.gutenberg.org/ebooks/1342) |
| Charles Dickens | A Tale of Two Cities, Book I, Chapter 1 | [#98](https://www.gutenberg.org/ebooks/98) |
| Charlotte Brontë | Jane Eyre, Chapter 23 | [#1260](https://www.gutenberg.org/ebooks/1260) |
| Emily Brontë | Wuthering Heights, Chapter 9 | [#768](https://www.gutenberg.org/ebooks/768) |
| Herman Melville | Moby-Dick, Chapter 1 | [#2701](https://www.gutenberg.org/ebooks/2701) |
| Henry David Thoreau | Walden, “Where I Lived, and What I Lived For” | [#205](https://www.gutenberg.org/ebooks/205) |
| Ralph Waldo Emerson | Self-Reliance | [#2944](https://www.gutenberg.org/ebooks/2944) |
| Ralph Waldo Emerson | Self-Reliance | [#2944](https://www.gutenberg.org/ebooks/2944) |
| William Wordsworth | “My heart leaps up when I behold” | [#12145](https://www.gutenberg.org/ebooks/12145) |
| John Keats | Endymion, Book I | [#24280](https://www.gutenberg.org/ebooks/24280) |
| Percy Bysshe Shelley | Ozymandias | [#4800](https://www.gutenberg.org/ebooks/4800) |
| Walt Whitman | Leaves of Grass, “Song of Myself” | [#1322](https://www.gutenberg.org/ebooks/1322) |
| Emily Dickinson | “Hope is the thing with feathers” | [#2679](https://www.gutenberg.org/ebooks/2679) |
| William Blake | The Tyger | [#574](https://www.gutenberg.org/ebooks/574) |
| John Locke | Second Treatise of Government, Chapter VI | [#7370](https://www.gutenberg.org/ebooks/7370) |
| David Hume | A Treatise of Human Nature, Book II | [#4705](https://www.gutenberg.org/ebooks/4705) |
| John Stuart Mill | On Liberty, Chapter II | [#34901](https://www.gutenberg.org/ebooks/34901) |
| Francis Bacon | Essays, “Of Studies” | [#575](https://www.gutenberg.org/ebooks/575) |
| Thomas Hobbes | Leviathan, Chapter XIII | [#3207](https://www.gutenberg.org/ebooks/3207) |

## طراحی
ظاهری تیره و مدرن (لاجوردی تا سیاه) با کارت شیشه‌ای و جزئیات طلایی. پس‌زمینهٔ متحرک الهام‌گرفته از نگارگری ایرانی و نقاشی‌های شاهنامه است:
سیمرغ که آرام از آسمان می‌گذرد، رستم سوار بر رخش و سواری دیگر که از دامنه می‌تازند، کوه‌های مرجانیِ پیچ‌دار، سرو و درخت شکوفه، گل‌های ریز، ابرهای چینیِ طلایی که می‌لغزند، ماه طلایی و غبار درخشان.
لایه‌ها با اختلاف منظر (parallax) حرکت می‌کنند. همهٔ انیمیشن‌ها در زبانهٔ پنهان متوقف می‌شوند و با تنظیم «کاهش حرکت» سیستم، صحنه ثابت می‌ماند. کارنامه آمار را با شمارش متحرک و نمودار سرعت ثانیه‌به‌ثانیه نشان می‌دهد.

همهٔ نقش‌ها (پوشهٔ `assets`) را خود این پروژه به صورت SVG کشیده است (اسکریپت `tools/gen_art.py`)؛ از هیچ تصویر بیرونی یا دارای حق نشری استفاده نشده است. قلم: وزیرمتن (OFL).
