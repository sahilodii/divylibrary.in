$inputCsv = 'C:\xampp\htdocs\divylibrary.in\library-file-inventory.csv'
$outputCsv = 'C:\xampp\htdocs\divylibrary.in\library-categorized-catalog.csv'
$summaryCsv = 'C:\xampp\htdocs\divylibrary.in\library-category-summary.csv'
$categories = @('Indian Heritage & Sacred Knowledge','Spirituality & Inner Wisdom','Mind & Personal Growth','Money & Investing','Business & Digital Growth','Literature & Stories','Health & Lifestyle','Kids & Parenting','Education & Career','Technology & Engineering','Astrology & Ancient Mysteries','People, Relationships & Hobbies')

function Resolve-Book([string]$title,[string]$archive,[string]$path,[string]$format) {
  $t = ("$title $path" -replace '[^\p{L}\p{Nd}]',' ').ToLowerInvariant(); $s = "$archive $path".ToLowerInvariant()
  $cat=''; $sub=''; $confidence='Title match'; $review=''
  if ($format -notin @('pdf','epub','mp3','m4a','mp4','mov')) { return @{Category='';Subcategory='';Confidence='';Review='Not a book/audio/video title'} }
  if ($t -match 'bhagavad.?gita of option trading|gita.*option trading|option trading.*gita') { $cat=$categories[3];$sub='Trading & Investment Psychology' }
  elseif ($t -match 'business financ|finance.*business|business loan|venture capital|crowdfunding') { $cat=$categories[4];$sub='Business Finance & Entrepreneurship' }
  elseif ($t -match 'fiction|novel|historical fiction|mythological fiction|romance|thriller|mystery|upanyas|shahitya|krishna.?s? autobiography|karn.?s? autobiography|the hidden hindu|matsyagandha|seeta sochti|krishna kunji|kitne pakistan|october junction|atithi \(hindi\)|ek gadhe ki aatmkatha|taming the biker|the broken vows|angels of the universe') { $cat=$categories[5];$sub='Fiction, Stories & Named Override' }
  elseif ($t -match 'sanskrit.?hindi.?english dictionary|sanskrit dictionary|chaturvedi sanskrit|chando.?manjari|pingal.?krit|pingle') { $cat=$categories[8];$sub='Dictionaries & Sanskrit Learning' }
  elseif ($t -match 'market mind games|psychology of investing|investing psychology|trading psychology') { $cat=$categories[3];$sub='Investing Psychology' }
  elseif ($t -match 'therapeutic yoga|yoga for .*health|yoga body diet|yoga for women wellness|supporting yoga students with common injuries') { $cat=$categories[6];$sub='Therapeutic Yoga & Wellness' }
  if (-not $cat) {
  if ($t -match 'astrolog|jyotish|numerolog|palmistr|palm.?read|vastu|lal.?kitab|dream interpret|tantra.?vastu|bhrigu|indra.?jal|occult|ancient myst') { $cat=$categories[10];$sub='Astrology, Vastu & Esoteric Literature' }
  elseif ($t -match 'veda|upanishad|puran|mahabharat|ramayan|bhagavad.?gita|bhagwat.?geeta|shrimad.?gita|chanakya.?neeti|darshan|shastra|granth|sanskrit scripture|quraan|quran|buddha and his dhamma|guru.?granth|chalisa|stotram|sahastr|hindu dharma|indian history|world history|historical|shivaji|maharana pratap|azad hind|bharat vibhajan|indian culture|teerth|festival|gurukul') { $cat=$categories[0];$sub='History, Scriptures & Indian Philosophy' }
  elseif ($s -match 'upanishad|puran|granth|history|spritual bhartiya sashtras|saasht|bharatiya shastra') { $cat=$categories[0];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'osho|aatmkrati|aptavani|self.?realisation|self.?realization|enlightenment|consciousness|meditat|kundalini|nath samprad|mystic|spiritual awakening|spiritual wisdom|yoga sutra|yoga vasishta|yog.?sakshatkar|bhaktiyoga|ishwar darshan|yog.?sadhana|gorakhbani|tantra|mantra|sadhna rahasy|shyamakali|kali upasana|patanjali') { $cat=$categories[1];$sub='Spirituality, Yoga & Inner Wisdom' }
  elseif ($s -match '(^|[/ ])osho|07_spritual books|08_spritual hindi|40\+ yoga|tantra mantra') { $cat=$categories[1];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'psycholog|self.?help|self.?mastery|self.?esteem|mindset|habit|discipline|motivat|personal growth|productiv|time management|emotional intelligence|confidence|human behaviour|human behavior|stress management|positive thinking|resilien|focus|morning ritual|organized mind|gratitude|law of attraction|growth mindset|journaling|self.?awareness|limiting belief|character building|life purpose|affirmation|success mindset') { $cat=$categories[2];$sub='Psychology & Self-Mastery' }
  elseif ($s -match 'motivational books hindi|2000\+ the 1|psychology and self-help|self help books|self.?development') { $cat=$categories[2];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'stock market|stock.?trad|invest|finance|financial|wealth|money|cryptocurrency|crypto|bitcoin|forex|real estate|property invest|technical analysis|fundamental analysis|financial literacy|personal finance|millionaire|budget|economics|banking|mutual fund|portfolio|candlestick|trading') { $cat=$categories[3];$sub='Finance, Investing & Markets' }
  elseif ($s -match 'finance ebooks|stock market|real estate|millionaire.?s private finance vault') { $cat=$categories[3];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'business|entrepreneur|startup|leadership|management|sales|marketing|seo|social media marketing|affiliate|copywriting|email marketing|e.?commerce|dropship|branding|private label rights|plr|venture capital|crowdfunding|business plan|coaching business|digital marketing|content creation|traffic|adsense|elevator pitch|outsourcing|business growth|amazon s3 crash course') { $cat=$categories[4];$sub='Business, Entrepreneurship & Digital Marketing' }
  elseif ($s -match 'business ebooks|marketing ebooks|digital marketing|dropshipping|business ebooks plr|premium digital marketing|marketing ebooks') { $cat=$categories[4];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'recipe|cookbook|cooking|nutrition|diet|weight.?loss|fitness|health|wellness|ayurved|medicine|yoga for|yoga body|yoga.?health|sports?|outdoor activities|workout|metabolism|nutrition|injuries|asana|pranayam|pranayama|therapeutic') { $cat=$categories[6];$sub='Health, Nutrition, Yoga & Recipes' }
  elseif ($s -match 'ayurvedic and medicine|recipes|weight loss diet|sports & outdoor|40\+ yoga') { $cat=$categories[6];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'kids?|children|worksheet|coloring|colouring|comic|panch.?tantra|parenting|child development|early learning|activity book|kids education|moral stor|preschool|nursery|autism|children wellness|kids story|school workbook') { $cat=$categories[7];$sub='Children, Learning & Parenting' }
  elseif ($s -match 'kids story books|kids work sheet|coloring pages|kids educational resources|parenting') { $cat=$categories[7];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'competitive exam|exam prep|upsc|ssc|aptitude|entrance exam|question bank|general knowledge|english speaking|spoken english|grammar|communication skill|dictionary|academic|textbook|educational|career development|professional skill|sanskrit dictionary|english language|physics|astrophysics|a brief history of time|a short history of nearly everything') { $cat=$categories[8];$sub='Education, Exams & Language' }
  elseif ($s -match 'competitive books|english speeking|educational ebooks|prashanottri') { $cat=$categories[8];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'programming|computer science|software development|web development|information technology|engineering|artificial intelligence|machine learning|cloud computing|electrical|electronics|technical education|coding|database|cyber.?security|robotics|s3 crash course') { $cat=$categories[9];$sub='Technology & Engineering' }
  elseif ($s -match 'it & programming|electric engineering') { $cat=$categories[9];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'biograph|autobiograph|memoir|life story|personalities|dating|relationship|family life|women liberation|politic|society|ambedkar|nehru|mueller report|hobbies|craft|pet care|animal|gardening|knitting|sewing|photography|art & craft') { $cat=$categories[11];$sub='Biography, People & Hobbies' }
  elseif ($s -match 'biography|dating|hobbies & crafts|pet animal') { $cat=$categories[11];$sub='Source-folder collection';$confidence='Source folder' }
  elseif ($t -match 'novel|fiction|short stor|stories|romance|thriller|mystery|poetry|poems|literature|classic|plays|drama|upanyas|sahitya|shahitya|hindi story|comics|ghazal|कथा|कविता|उपन्यास|आत्मकथा') { $cat=$categories[5];$sub='Literature, Fiction & Stories' }
  elseif ($s -match 'story books|shahitya-upanyas|comics|novels and stories') { $cat=$categories[5];$sub='Source-folder collection';$confidence='Source folder' }
  else { $cat='';$sub='';$confidence='';$review='Review Required — mixed source or title does not establish subject' }
  }
  return @{Category=$cat;Subcategory=$sub;Confidence=$confidence;Review=$review}
}

$rows=Import-Csv -LiteralPath $inputCsv
$items=foreach($r in $rows){
  $m=Resolve-Book $r.Title $r.Archive $r.FilePath $r.Format
  $kind=if($r.Format -in @('pdf','epub')){'Book'}elseif($r.Format -in @('mp3','m4a')){'Audiobook'}elseif($r.Format -in @('mp4','mov')){'Video/course'}elseif($r.Format -in @('doc','docx','xls','xlsx','xlsm','ppt','pptx','rtf','txt','csv','dotx','xlt','xltx')){'Document/resource'}else{'Administrative/media/archive'}
  $langText="$($r.Title) $($r.FilePath) $($r.Archive)";$langSet=[System.Collections.Generic.List[string]]::new();if($langText -match 'gujarati|ગુજરાતી'){$langSet.Add('Gujarati')};if($langText -match 'hindi|हिंदी|हिन्दी'){$langSet.Add('Hindi')};if($langText -match 'sanskrit|संस्कृत|devanagari|उपनिषद|वेद|दर्शन'){$langSet.Add('Sanskrit')};if($r.Archive -match 'English'){$langSet.Add('English')};$lang=if($langSet.Count){($langSet|Sort-Object -Unique)-join '; '}else{'Unclear'}
  $special=@();$x="$($r.Title) $($r.FilePath)".ToLowerInvariant()
  if($x -match 'rigved|samved|yajurved|atharva.?ved|arthved'){$special+='Complete Vedas Collection (coverage unverified)'}
  if($x -match 'mahabharat|jaya mahabharat'){$special+='Mahabharata Collection'}
  if($x -match 'puran'){$special+='Puranas Collection'}
  if($x -match 'bhagavad.?gita|bhagwad.?gita|bhagwat.?geeta|ishwar gita|uddhav gita'){$special+='Bhagavad Gita Collection'}
  if($x -match 'upanishad'){$special+='108 Upanishads Collection'}
  if($x -match 'mimansa darshan|nyay darshan|sankhya darshan|vaisheshik darshan|vedant darshan|yog darshan'){$special+='Six Schools of Indian Philosophy'}
  if($x -match 'osho'){$special+='Osho Collection'}
  if($x -match 'yoga|meditat|pranayam|pranayama'){$special+='Yoga & Meditation Collection'}
  if($x -match 'tantra|gorakhbani|nath samprad'){$special+='Tantra & Nath Sampradaya Collection'}
  if($x -match 'self.?real|consciousness|enlightenment|aptavani'){$special+='Self-Realisation & Consciousness'}
  if($x -match 'psycholog|self.?mastery|mindset|atomic habits'){$special+='Psychology & Self-Mastery'}
  if($x -match 'personal finance|wealth|financial literacy|money|invest'){$special+='Wealth & Financial Literacy'}
  if($x -match 'stock market|stock.?trad|technical analysis|candlestick'){$special+='Stock Market Mastery'}
  if($x -match 'business|entrepreneur|startup'){$special+='Business & Entrepreneurship'}
  if($x -match 'digital marketing|seo|affiliate marketing|dropship'){$special+='Digital Marketing Mastery'}
  if($x -match 'hindi|उपन्यास|कथा|कविता|साहित्य'){$special+='Hindi Literature Collection'}
  if($x -match 'kids?|children|worksheet|coloring|colouring|panch.?tantra'){$special+="Children's Learning Collection"}
  if($x -match 'english speaking|spoken english|grammar'){$special+='English Speaking Collection'}
  if($x -match 'ayurved|wellness|yoga|health'){$special+='Ayurveda & Wellness'}
  if($x -match 'astrolog|jyotish|vastu|numerolog|lal.?kitab'){$special+='Astrology & Vastu'}
  if($x -match 'biograph|autobiograph|memoir|life story'){$special+='Biographies of Great Personalities'}
  if($x -match 'programming|engineering|software|coding|computer science'){$special+='Programming & Engineering'}
  $admin=if($r.Title -match '(?i)readme|license|licence|checklist|promotional|promo|cover image|instructions|start here first'){'Administrative/support file'}else{''}
  $classifiedKind=if($admin){$admin}else{$kind}
  $status=if($kind -in @('Book','Audiobook','Video/course') -and $m.Review){$m.Review}elseif($kind -eq 'Book'){'Classified'}elseif($kind -in @('Audiobook','Video/course') -and $m.Category){'Classified by title'}else{$classifiedKind}
  [pscustomobject]@{Category=$m.Category;Subcategory=$m.Subcategory;LanguageFilter=$lang;Format=$r.Format;Kind=$classifiedKind;Title=$r.Title;SpecialCollections=($special -join '; ');Status=$status;ClassificationBasis=$m.Confidence;DistributionRights='Unverified — not assessed';SourceArchive=$r.Archive;OriginalPath=$r.FilePath;Bytes=$r.Bytes}
}
$items | Export-Csv -LiteralPath $outputCsv -NoTypeInformation -Encoding utf8
$items | Where-Object {$_.Kind -eq 'Book'} | Group-Object Category | Sort-Object Name | ForEach-Object {
  [pscustomobject]@{Category=if($_.Name){$_.Name}else{'Review Required'};Books=$_.Count;NeedsReview=($_.Group|Where-Object {$_.Status -like 'Review Required*'}).Count;SampleTitles=(($_.Group|Select-Object -First 6 -ExpandProperty Title)-join ' | ')}
} | Export-Csv -LiteralPath $summaryCsv -NoTypeInformation -Encoding utf8
Import-Csv -LiteralPath $summaryCsv | Format-Table -AutoSize
Write-Output "Catalog: $outputCsv"
Write-Output "Summary: $summaryCsv"
