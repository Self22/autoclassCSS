﻿/**
 * AutoclassCSS - Generator CSS skeleton: https://github.com/tenorok/autoclassCSS
 * @copyright 2012–2013 Artem Kurbatov, tenorok.ru
 * @license MIT license
 * @version 0.0.1
 */

$(document).ready(function() {
	
	// Событие срабатывает при отпускании клавиши на клавиатуре в текстовом поле для HTML-кода
    $('#html-code').keyup(function () {
	
		var html = $(this).val();						// Полученный HTML-код
				
		// Отображение итогового результата
		$('#css-code').val(
			// Формирование CSS-каркаса
			generateCSS(
				// Вычисление уровней вложенности тегов и классов
				generateLevel(
					// Парсинг html-разметки и формирование массива классов
					searchOpenTags(html)				// К массиву с данными об открывающихся тегах
					.concat(searchCloseTags(html))		// Конкатенируется массив с данными о закрывающихся тегах
					.concat(searchClasses(html))		// Конкатенируется массив с данными о классах
					.sort(function(a, b) {				// И полученный суммарный массив сортируется по возрастанию позиции вхождения элемента в html-строку
						return a.position - b.position;
					})
				)
			)
		)
	});
	
	// Начало
	// - Функции для парсинга HTML
	
			// Поиск открывающих тегов
			function searchOpenTags(str) {
		
				var bracket = new Array();
		
				var pattern = /<[-A-Za-z0-9_]+/i; // Открывающие теги
		
				var pos = str.search(pattern);
				var old_pos = pos;
		
				for(var count = 0; pos != -1; count++) {
					
					var val = str.match(pattern);
					
					bracket[count] = new Array();
					bracket[count]['dtype'] = 'open_tag';
					bracket[count]['position'] = old_pos;
					bracket[count]['name'] = val[0].substr(1);
					
					str = str.substr(pos + 1);
					pos = str.search(pattern);
			
					if(pos >= 0) {
						old_pos += pos + 1;
					}
				}
				
				return bracket;
			}
	
			// Поиск закрывающих тегов
			function searchCloseTags(str) {
		
				var bracket = new Array();
		
				var pattern = '</';
		
				var pos = str.indexOf(pattern);
		
				for(var count = 0; pos != -1; count++) {
			
					bracket[count] = new Array();
					bracket[count]['dtype'] = 'close_tag';
					bracket[count]['position'] = pos;
			
					pos = str.indexOf(pattern, pos + pattern.length);
				}
				
				return bracket;
			}
    
			// Поиск классов
			function searchClasses(str) {
		
				var bracket = new Array();
		
				var pattern = /class\s*=\s*('|")\s*[-A-Za-z0-9_\s*]+\s*('|")/i; // Класс (с учётом возможности пробелов по бокам равенства и пробелов вокруг классов в кавычках)
		
				var pos = str.search(pattern);
				var old_pos = pos;
				var old_pos2 = -1;
		
				for(var count = 0; pos != -1; count++) {
					
					var cls = str.match(pattern)[0]
								 .match(/('|")[\s*-A-Za-z0-9_\s*]+('|")/i)[0]
								 .replace(/\s*('|")\s*/g, '');                  // class="всё_что_находится_здесь"
					
					// Если в кавычках указан хотя бы один класс
					if(cls) {
						
						// Если в кавычках указано несколько классов, то их надо разбить по одному
						var res = 	cls
									.replace(/\s+/g, ' ')
									.split(' ');

						for(var c = 0; c < res.length; c++) {
							bracket[count] = new Array();
							bracket[count]['dtype'] = 'class';
							bracket[count]['position'] = pos;
							bracket[count]['val'] = res[c];
							count++;
						}
						count--;
					}
					else
						count--;
			
					str = str.substr(pos - old_pos2);
			
					pos = str.search(pattern);
			
					if(pos >= 0) {
						pos += old_pos + 1;
						old_pos2 = old_pos;
						old_pos += pos - old_pos2;
					}
				
				}
				
				return bracket;
			}
	// Функции для парсинга HTML -
	// Конец
	
	// Начало
	// - Функции вычисления вложенности классов
	
			function generateLevel(arr) {
				
				return classesLevel(
					reformateArr(arr)
				);
			}
			
			/* Составление единого массива в формате: (на основании одноуровневого массива, склееного в порядке следования открывающих тегов, классов и закрывающих тегов)
				Array
				(
					[0] => Array
					(
						[dtype] => open_tag
						[name] => div
						[single] => false
						[classes] => Array
							(
								[0] => class_name_0
								[1] => class_name_1
								...
							)
					)
					[1] => Array
					(
						[dtype] => close_tag
					)
					...
				)
			*/
			function reformateArr(arr) {
				
				var tree = new Array();
				var iterate = -1;
				var cls;
				var singleTags = ['!doctype', 'base', 'br', 'frame', 'hr', 'img', 'input', 'link', 'meta'];
				
				for(e in arr) {
					
					switch(arr[e]['dtype']) {
						
						case 'open_tag':
							tree[++iterate] = new Array();
							tree[iterate]['dtype'] = 'open_tag';
							tree[iterate]['name'] = arr[e]['name'];
							
							if($.inArray(arr[e]['name'], singleTags) >= 0)
								tree[iterate]['single'] = true;
							else
								tree[iterate]['single'] = false;
							
							tree[iterate]['level'] = null;
							
							tree[iterate]['classes'] = new Array();
							cls = -1;
							break;
						
						case 'class':
							tree[iterate]['classes'][++cls] = new Array();
							tree[iterate]['classes'][cls] = arr[e]['val'];
							break;
						
						case 'close_tag':
							tree[++iterate] = new Array();
							tree[iterate]['dtype'] = 'close_tag';
							break;
					}
				}
				
				return tree;
			}

			/* Составление массива классов в формате:
				Array
				(
					[0] => Array
						(
							[name] => class_name_0
							[level] => 0
						)
					[1] => Array
						(
							[name] => class_name_1
							[level] => 1
						)
					...
				)
			*/
			function classesLevel(arr) {
				
				var classes = new Array();													// Массив для ретурна
				var tree = new Array();														// Массив для отслеживания дерева
				var repete = new Array();													// Массив для отслеживания повторов классов
				var iterate = -1;
				
				for(e in arr) {																// Цикл по массиву, составленному функцией reformateArr()

					switch(arr[e]['dtype']) {

						case 'open_tag':													// Если текущий элемент является открывающим тегом
							
							tree.push(arr[e]);												// Тег открылся, значит надо добавить его в дерево
							
							var level = -1;
							
							for(t in tree) {												// Цикл по тегам дерева
								
								if(tree[t]['classes'].length > 0) {							// Если у тега есть хотя бы один класс
									
									// Начало - Высчитывание level
									if(tree[t]['level'] == null) {							// Если к этому тегу идёт первое обращение
										
										for(c in tree[t]['classes']) {						// Цикл по классам текущего тега
										
											var class_name = tree[t]['classes'][c];			// Для удобства имя класса перегоняется в отдельную переменную
											
											if($.inArray(class_name, repete) < 0) {			// Если в массиве уже добавленных ранее классов нет текущего класса тега
												
												level++;									// Прибавление уровня вложенности на единицу
												break;										// и выход из цикла
											}
										}
									}
									else													// Иначе к этому тегу идёт не первое обращение
										level = tree[t]['level'];							// и у него уже задан уровень, остаётся только его переприсвоить
									// Конец  - Высчитывание level
									
									addClass(tree[t]['classes'], false);					// Добавление в массив классов всех необходимых классов текущего тега
									
									if(tree[t]['name'] == 'ul' || tree[t]['name'] == 'ol')	// Если текущий тег называется ul или ol
										addClass(tree[t]['classes'], 'li');					// то для его элементов так же добавляется блок стилей
									
									tree[t]['level'] = level;								// Сохранение высчитанного уровня для тега
								}
							}
							
							if(arr[e]['single'])											// Если тег одиночный, то он не участвует в иерархическом дереве
								tree.pop();													// и его надо удалить
							
							break;															// Выход из case
						
						case 'close_tag':													// Если текущий элемент является закрывающим тегом
							
							tree.pop();														// Если тег закрылся, то нужно удалить его из дерева
							
							break;															// Выход из case
					}
				}
				
				// Функция добавления элемента в массив классов, который затем будет выведен
				function addClass(tagClss, mode) {											// В качестве первого параметра принимается массив классов текущего тега
					
					var addLevel = 0;														// Переменная для задания дополнительного уровня вложенности без влияния на общую иерархию вложенности
					
					for(c in tagClss) {														// Цикл по классам тега
											
						var class_name = tagClss[c];										// Для удобства имя класса перегоняется в отдельную переменную
						
						if(class_name != 'clearfix') {										// Если текущий класс не называется clearfix
							
							if(mode == 'li') {												// Если текущий модификатор предусматривает подготовку стилей для li
								
								class_name += ' li';										// то в конец имени класса добавляется li
								addLevel = 1;												// и для этого блока увеличивается уровень вложенности относительно текущего уровня на единицу
							}
							
							if($.inArray(class_name, repete) < 0) {							// Если в массиве уже добавленных ранее классов нет текущего класса тега
								
								classes[++iterate] = new Array();							// Создание подмассива для класса в массиве классов
								classes[iterate]['name'] = class_name;						// Добавление имени класса в подмассив
								classes[iterate]['level'] = level + addLevel;				// Добавление уровня вложенности класса в подмассив
							}
							
							repete.push(class_name);										// Добавление текущего класса в массив для отслеживания повторов
						}
					}
				}
				
				return classes;																// Возврат конечного сформированного массива, готового к выводу
			}
			
	// Функции вычисления вложенности тегов и классов
	// Конец
	
	// Формирование строки каркаса CSS для дальнейшего вывода
	function generateCSS(classes) {
		
		var css  = '';			 // Текст CSS
		
		for(c in classes) {
			
			var tabs = '';
			for(l = 0; l < classes[c]['level']; l++)
				tabs += '	';
			
			css += tabs + '.' + classes[c]['name'] + ' {\n' + tabs + '	\n' + tabs + '}\n';
		}
		
		return css;
	}
});