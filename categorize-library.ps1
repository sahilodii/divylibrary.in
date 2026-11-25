$root = 'C:\Users\sahil\OneDrive\Desktop\divy_lib'
$inputCsv = 'C:\xampp\htdocs\divylibrary.in\library-file-inventory.csv'
$outputCsv = 'C:\xampp\htdocs\divylibrary.in\library-categorized-catalog.csv'
$summaryCsv = 'C:\xampp\htdocs\divylibrary.in\library-category-summary.csv'

function Get-Shelf([string]$title, [string]$archive, [string]$path, [string]$format) {
    # Keep the archive name out of title matching: broad bundles contain mixed subjects.
    # Match only the book title and its internal path, then use the outer archive as a fallback.
    $t = "$title $path".ToLowerInvariant()
    if ($format -in @('mp3','m4a')) { return @('Audiobooks & Audio Learning','Format-based') }
    if ($format -in @('mp4','mov')) { return @('Video Courses & Lessons','Format-based') }
    if ($format -in @('zip','rar','cbr','cbz','exe','js','css','html','ico','psd','ini','gif','jpg','jpeg','png')) { return @('Supplementary Media / Archive','Format-based') }
    if ($t -match 'upanishad|bhagavad.?gita|mahabharat|ramayan|puran|rigveda|vedas?|sanskrit|jyotish|astrolog|tantra|mantra|vedic|shastra|hindu|spiritual|religio|buddh|vedanta|osho|bhakti') { return @('Indian Scriptures & Spirituality','Title/source match') }
    if ($t -match 'history|historical|ancient|civilization|civilisation|empire|dynasty|war of|world war|indian culture|bharat|mughal|maratha|ashoka|shivaji|biograph|autobiograph|memoir|life of') { return @('History & Biography','Title/source match') }
    if ($t -match 'recipe|cookbook|cooking|kitchen|cuisine|baking|food|meal plan|vegetarian|vegan|dessert') { return @('Food & Recipes','Title/source match') }
    if ($t -match 'ayurved|medical|medicine|health|wellness|yoga|fitness|weight.?loss|diet|nutrition|workout|anatomy|disease|mental health') { return @('Health, Yoga & Ayurveda','Title/source match') }
    if ($t -match 'parenting|parenthood|raising children|child development|family guide|pregnancy|motherhood|fatherhood') { return @('Family & Parenting','Title/source match') }
    if ($t -match 'kids?|children|worksheet|coloring|colouring|comic|comics|school workbook|activity book|early learning|phonics|preschool|nursery') { return @('Kids & Creative Learning','Title/source match') }
    if ($t -match 'stock market|stock trading|invest|finance|financial|money|wealth|cryptocurrency|crypto|bitcoin|trading|forex|real estate|property|accounting|economics|budget|taxation|banking') { return @('Money & Investing','Title/source match') }
    if ($t -match 'marketing|advertis|digital media|social media|seo|dropship|e.?commerce|startup|entrepreneur|business|sales|management|leadership|brand|franchise|supply chain|human resource|business plan') { return @('Business & Marketing','Title/source match') }
    if ($t -match 'psycholog|mindset|habits?|self.?help|self.?esteem|motivat|personal growth|productiv|confidence|emotional intelligence|mindfulness|stress|anxiety|communication skills|relationships?|philosophy|success|discipline|purpose|life skills') { return @('Mindset & Psychology','Title/source match') }
    if ($t -match 'programming|computer|software|coding|technology|engineering|electrical|electronics|network|database|artificial intelligence|machine learning|data science|cyber security|robotics|mathematics|physics|chemistry') { return @('Technology & Engineering','Title/source match') }
    if ($t -match 'competitive|exam|exam prep|upsc|ssc|bank po|aptitude|entrance|question paper|general knowledge|gk book|textbook|educational|curriculum|cbse|school subject') { return @('Education & Exam Preparation','Title/source match') }
    if ($t -match 'hindi|हिंदी|upanyas|sahitya|shahitya|कथा|कविता|ग़ज़ल|ghazal|kavita|hindi story') { return @('Hindi Literature & Language','Title/source match') }
    if ($t -match 'novel|fiction|short stor|stories|romance|thriller|mystery|poetry|poems|literature|classic|plays|drama|english speaking|spoken english|grammar|vocabulary|english language') { return @('English Literature & Language','Title/source match') }
    if ($t -match 'pet|animal|dog|cat|bird|wildlife|hobby|craft|knitting|sewing|gardening|sports?|outdoor|travel|photography|music|art and design') { return @('Hobbies, Sports & Animals','Title/source match') }
    if ($archive -match 'English Audio Book') { return @('Audiobooks & Audio Learning','Source-folder match') }
    if ($archive -match 'History') { return @('History & Biography','Source-folder match') }
    if ($archive -match 'Puran|Granth|Upanishad|Spritual|Spiritual|Jyotish|Tantra') { return @('Indian Scriptures & Spirituality','Source-folder match') }
    if ($archive -match 'Recipe') { return @('Food & Recipes','Source-folder match') }
    if ($archive -match 'Ayurvedic|Yoga|Weight Loss') { return @('Health, Yoga & Ayurveda','Source-folder match') }
    if ($archive -match 'Parenting') { return @('Family & Parenting','Source-folder match') }
    if ($archive -match 'Kids|KIDS|Coloring|Comics') { return @('Kids & Creative Learning','Source-folder match') }
    if ($archive -match 'Finance|Stock Market|Real Estate') { return @('Money & Investing','Source-folder match') }
    if ($archive -match 'Business|Marketing|Digital Marketing') { return @('Business & Marketing','Source-folder match') }
    if ($archive -match 'Motivational|1% Club|Universal Growth|Osho') { return @('Mindset & Psychology','Source-folder match') }
    if ($archive -match 'IT & Programming|Electric Engineering') { return @('Technology & Engineering','Source-folder match') }
    if ($archive -match 'Competitive|Educational') { return @('Education & Exam Preparation','Source-folder match') }
    if ($archive -match 'English Speeking') { return @('English Literature & Language','Source-folder match') }
    if ($archive -match 'Shahitya-Upanyas Hindi') { return @('Hindi Literature & Language','Source-folder match') }
    if ($archive -match 'Shahitya-Upanyas|Story Books|Biography|English E-Books|English Books Bundle') { return @('English Literature & Language','Broad source; title not specific') }
    if ($archive -match 'Hobbies|Sports|Pet Animal') { return @('Hobbies, Sports & Animals','Source-folder match') }
    if ($format -in @('pdf','epub')) { return @('General Reading — Needs Title Review','No reliable subject signal') }
    return @('Non-book / Needs Review','No reliable subject signal')
}

$rows = Import-Csv -LiteralPath $inputCsv
$catalog = foreach ($row in $rows) {
    $match = Get-Shelf $row.Title $row.Archive $row.FilePath $row.Format
    $kind = if ($row.Format -in @('pdf','epub')) { 'Book' } elseif ($row.Format -in @('mp3','m4a')) { 'Audiobook' } elseif ($row.Format -in @('mp4','mov')) { 'Video lesson/course' } elseif ($row.Format -in @('doc','docx','xls','xlsx','xlsm','ppt','pptx','rtf','txt','csv','dotx','xlt','xltx')) { 'Document/resource' } else { 'Supplementary/non-book file' }
    [pscustomobject]@{Category=$match[0];Confidence=$match[1];Title=$row.Title;Format=$row.Format;Kind=$kind;SourceArchive=$row.Archive;PathInArchive=$row.FilePath;Bytes=$row.Bytes}
}
$catalog | Export-Csv -LiteralPath $outputCsv -NoTypeInformation -Encoding utf8
$catalog | Group-Object Category | Sort-Object Name | ForEach-Object {
    $items = $_.Group | Where-Object {$_.Kind -eq 'Book'}
    $samples = ($items | Select-Object -First 5 -ExpandProperty Title) -join ' | '
    [pscustomobject]@{Category=$_.Name;Books=$items.Count;AllFiles=$_.Count;SampleTitles=$samples}
} | Export-Csv -LiteralPath $summaryCsv -NoTypeInformation -Encoding utf8
Import-Csv -LiteralPath $summaryCsv | Format-Table -AutoSize
Write-Output "Catalog: $outputCsv"
Write-Output "Category summary: $summaryCsv"
