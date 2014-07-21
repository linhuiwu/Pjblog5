﻿var CommentModule = new Class({
	initialize: function(){
		if ( !this.conn ){
			var MEMBER = require('./user'),
				member = new MEMBER();
			
			this.dbo = member.dbo;
			this.conn = member.conn;
			
			var uid = 0,
				group = 0,
				status = member.loginStatus(function(rets, object){
					uid = object('id').value;
					group = object('member_group').value;
				});
			
			if ( !group ){
				group = '0';
			}
			group = Number(group);
			if ( group < 1 ){
				group = 1;
			}
			
			this.uid = uid;
			this.login = status.login;
			this.group = this.GroupLevel(group);
		}else{
			this.group = this.GroupLevel(2);
		}
	}
});

CommentModule.extend('GroupLevel', function( id ){
	var GroupCache = require('private/chips/' + blog.cache + 'blog.groups'),
		LevelCache = require('private/chips/' + blog.cache + 'blog.levels'),
		_id = id + '',
		param = [];
		
	if ( GroupCache[_id] ){
		for ( var i = 0 ; i < GroupCache[_id].length ; i++ ){
			var t = GroupCache[_id][i] + '';
			if ( LevelCache[t] ){
				param.push(LevelCache[t]);
			}
		}
	};
	
	return param;
});

CommentModule.extend('post', function( params ){
	var id = params.form.id || 0,
		nick = params.form.nick || '',
		mail = params.form.mail || '',
		root = params.form.root || 0,
		content = params.form.content || '',
		ret = { success: false, message: '发表评论失败' },
		data = {};
		
	if ( this.group.indexOf('PostComments') === -1 ){
		ret.message = '您没有权限发表评论';
		return ret;
	};
		
	if ( content.length === 0 ){
		ret.message = '评论内容不能为空';
		return ret;
	};
	
	var global = require('private/chips/' + blog.cache + 'blog.global');
	var delay = global.blog_comment_delay;

	if ( delay && delay > 0 ){
		var time = Number(Session(blog.cache + "_comment_delay")) || 0;
		if ( new Date().getTime() - time < delay ){
			ret.message = '发表评论间隔是' + (delay / 1000) + '秒，请稍后再发表!';
			return ret;
		}
	};
	
	var date = require('date');

	data = {
		com_article_id: id,
		com_member_id: this.uid,
		com_content: content,
		com_parent: root,
		com_postdate: date.format(new Date(), 'y/m/d h:i:s'),
		com_username: nick,
		com_usermail: mail
	};
	
	var rec = new this.dbo.RecordSet(this.conn),
		cid = 0;
		
	rec
		.sql('Select * From blog_comments')
		.on('add', function(object){
			cid = object('id').value;
		})
		.open(2)
		.add(data)
		.close();
		
	if ( cid > 0 ){
		data.id = id;
		ret.success = true;
		ret.message = '发表评论成功';
		this.AddCountArticleComment(id);
		Session(blog.cache + "_comment_delay") = new Date().getTime();
	}else{
		return ret;
	}
	
	return ret;
	
});

CommentModule.extend('reply', function( params ){
	var id = params.form.id || 0,
		nick = params.form.nick || '',
		mail = params.form.mail || '',
		root = params.form.root || 0,
		content = params.form.content || '',
		ret = { success: false, message: '回复评论失败' },
		data = {};
		
	if ( this.group.indexOf('ReplyComment') === -1 ){
		ret.message = '您没有权限回复评论';
		return ret;
	};
		
	if ( content.length === 0 ){
		ret.message = '评论内容不能为空';
		return ret;
	};
	
	var global = require('private/chips/' + blog.cache + 'blog.global');
	var delay = global.blog_comment_delay;

	if ( delay && delay > 0 ){
		var time = Number(Session(blog.cache + "_comment_delay")) || 0;
		if ( new Date().getTime() - time < delay ){
			ret.message = '回复评论间隔是' + (delay / 1000) + '秒，请稍后再发表!';
			return ret;
		}
	};
	
	var date = require('date');

	data = {
		com_article_id: id,
		com_member_id: this.uid,
		com_content: content,
		com_parent: root,
		com_postdate: date.format(new Date(), 'y/m/d h:i:s'),
		com_username: nick,
		com_usermail: mail
	};
	
	var rec = new this.dbo.RecordSet(this.conn),
		cid = 0;
		
	rec
		.sql('Select * From blog_comments')
		.on('add', function(object){
			cid = object('id').value;
		})
		.open(2)
		.add(data)
		.close();
		
	if ( cid > 0 ){
		data.id = id;
		ret.success = true;
		ret.message = '回复评论成功';
		this.AddCountArticleComment(id);
		Session(blog.cache + "_comment_delay") = new Date().getTime();
	}else{
		return ret;
	}
	
	return ret;
	
});

CommentModule.extend('remove', function( params ){
	var id = params.query.id || 0,
		ret = { success: false, message: '删除评论失败' },
		that = this,
		k = 0,
		aid = 0;

	if ( id.length === 0 ){
		id = 0;
	}
	id = Number(id);
	if ( id < 1 ){
		return ret;
	};
	
	var rec = new this.dbo.RecordSet(this.conn);
	rec
		.sql('Select * From blog_comments Where id=' + id)
		.process(function(object){
			if ( !object.Bof && !object.Bof ){
				var uid = object('com_member_id').value;
				aid = object("com_article_id").value;
				if ( that.group.indexOf('RemoveComment') > -1 || that.uid === uid ){
					this.remove();
					ret.success = true;
					ret.message = '删除评论成功';
					k = 1;
				}else{
					ret.message = '您没有权限删除评论';
				}
			}
		}, 3);
		
	if ( ret.success ){
		rec = new this.dbo.RecordSet(this.conn);
		rec
			.sql('Select * From blog_comments Where com_parent=' + id)
			.open(3)
			.each(function(object){
				k = k + 1;
				object.Delete();
			})
			.close()
	};
	
	if ( k > 0 ){
		this.RemoveCountArticleComment(aid, k);
	}
	
	return ret;
});

CommentModule.extend('AddCountArticleComment', function(id){
	var rec = new this.dbo.RecordSet(this.conn);
	rec
		.sql('Select * From blog_articles Where id=' + id)
		.process(function(object){
			if ( !object.Bof && !object.Eof ){
				var i = object('art_comment_count').value;
				this.update({
					art_comment_count: i + 1
				});
			}
		}, 3);
});

CommentModule.extend('RemoveCountArticleComment', function(id, j){
	var rec = new this.dbo.RecordSet(this.conn);
	rec
		.sql('Select * From blog_articles Where id=' + id)
		.process(function(object){
			if ( !object.Bof && !object.Eof ){
				var i = object('art_comment_count').value;
				var o = i - j;
				if ( o < 0 ){
					o = 0;
				};
				this.update({
					art_comment_count: o
				});
			}
		}, 3);
});

return CommentModule;