&lt;!DOCTYPE html&gt;
&lt;html lang=&quot;ja&quot;&gt;
&lt;head&gt;
&lt;meta charset=&quot;UTF-8&quot;&gt;
&lt;title&gt;{$basic_pagetitle}&lt;/title&gt;
&lt;link rel=&quot;stylesheet&quot; type=&quot;text/css&quot; href=&quot;css/form.css?ver=1.2.0&quot; /&gt;
&lt;/head&gt;

&lt;body&gt;
&lt;div id=&quot;wrapper&quot;&gt;

    &lt;div id=&quot;main&quot;&gt;
		&lt;form method=&quot;post&quot; action=&quot;./&quot;&gt;
             &lt;div class=&quot;section&quot;&gt;
				&lt;h2 class=&quot;section__ttl&quot;&gt;{$basic_formname}(確認)&lt;/h2&gt;
				&lt;div class=&quot;section__body&quot;&gt;
					&lt;div id=&quot;txt_explain&quot;&gt;
					&lt;p&gt;記入事項をご確認の上、問題がなければ「送信」をクリックしてください。&lt;br /&gt;&lt;/p&gt;
					&lt;/div&gt;

					&lt;table class=&quot;table&quot; cellspacing=&quot;0&quot;&gt;
						{$form_data}
					&lt;/table&gt;

					&lt;div class=&quot;button_box&quot;&gt;
						&lt;input class=&quot;btn&quot; type=&quot;submit&quot; name=&quot;submit_button&quot; value=&quot;送信&quot;&gt;
    					&lt;input class=&quot;btn&quot; type=&quot;submit&quot; name=&quot;submit_button&quot; value=&quot;戻る&quot;&gt;
					&lt;/div&gt;

			&lt;/div&gt;

		&lt;/div&gt;
		
		
		&lt;/form&gt;

		&lt;div class=&quot;button_box&quot;&gt;
	&lt;!--		[&lt;a href=&quot;{$basic_moveurl}&quot;&gt;サイトへ戻る&lt;/a&gt;] --&gt;
		&lt;/div&gt;

	&lt;/div&gt;

&lt;/div&gt;
 
&lt;/body&gt;
&lt;/html&gt;