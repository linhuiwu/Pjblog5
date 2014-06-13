// JavaScript Document// JavaScript Document
var MemberModule = new Class({
	initialize: function(){
		if ( !this.conn ){
			var c = require('../library/connect');
			this.conn = c.conn;
			this.dbo = c.dbo;
		}
	}
});

MemberModule.extend('registor', function( params ){
	var mark = params.form.member_mark,
		nick = params.form.member_nick,
		mail = params.form.member_mail,
		pass = params.form.password,
		rpas = params.form.repeat_password;
		
	if ( !/^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/.test(mail) ){
		return { success: false, message: '邮箱格式不正确' };
	};
	
	if ( !mark || mark.length < 4 ){
		return { success: false, message: '登入ID必须大于等于4个字' };
	};
	
	if ( !nick || nick.length < 4 ){
		return { success: false, message: '昵称必须大于等于4个字' };
	};
	
	if ( !pass || pass.length < 6 ){
		return { success: false, message: '密码必须大于6个字符串' };
	};
	
	if ( !rpas || rpas.length === 0 ){
		return { success: false, message: '请重复密码' };
	};
	
	if ( pass !== rpas ){
		return { success: false, message: '两次输入的密码不相同' };
	};
	
	return this.regist(mark, nick, mail, pass);
});

MemberModule.extend('regist', function( mark, nick, mail, password ){
	var rec = new this.dbo.RecordSet(this.conn),
		canRegist = true;
	
	rec
		.sql("Select id From blog_members Where member_mark='" + mark + "'")
		.process(function(object){
			if ( !object.Eof && !object.Bof ){
				canRegist = false;
			}
		});
		
	if ( canRegist ){
		var salt = this.fns.randoms(10),
			sha1 = require('sha1'),
			date = require('date'),
			hashkey = sha1.make(password + salt),
			registParams = {
				member_mark: mark,
				member_nick: nick,
				member_salt: salt,
				member_hashkey: hashkey,
				member_mail: mail,
				member_group: 1,
				member_comments: 0,
				member_messages: 0,
				member_forbit: false,
				member_logindate: date.format(new Date(), 'y/m/d h:i:s')
			};
			
		rec = new this.dbo.RecordSet(this.conn);
		rec
			.sql('Select * From blog_members')
			.open(2)
			.add(registParams)
			.close();
			
		return { success: true, message: '注册用户成功' };
	}else{
		return { success: false, message: '用户登入ID已被注册' };
	}
});

MemberModule.extend('loginor', function( params ){
	var mark = params.form.UserName,
		pass = params.form.PassWord;
		
	if ( !mark || mark.length < 4 ){
		return { success: false, message: '登入ID必须大于等于4个字' };
	};
	
	if ( !pass || pass.length < 6 ){
		return { success: false, message: '密码必须大于6个字符串' };
	};
	
	return this.login(mark, pass);
});

MemberModule.extend('login', function( mark, pass ){
	var rec = new this.dbo.RecordSet(this.conn),
		rets = { success: false, message: '登入过程出错' },
		that = this;
	
	rec
		.sql("Select * From blog_members Where member_mark='" + mark + "'")
		.process(function(object){
			if ( !object.Bof && !object.Eof ){
				var salt = object('member_salt').value,
					hashkey = object('member_hashkey').value,
					id = object('id').value,
					sha1 = require('sha1'),
					date = require('date');
					
				if ( sha1.make(pass + salt) === hashkey ){
					rets.success = true;
					rets.message = '登录成功';
					
					salt = that.fns.randoms(10);
					hashkey = sha1.make(pass + salt);
					object('member_salt') = salt;
					object('member_hashkey') = hashkey;
					object('member_logindate') = date.format(new Date(), 'y/m/d h:i:s');
					object.Update();
					
					(function( cookie ){
						cookie.set(blog.cookie + "_user", "id", id);
						cookie.set(blog.cookie + "_user", "hashkey", hashkey);
						cookie.expire(blog.cookie + "_user", 30 * 24 * 60 * 60 * 1000);
					})( require('cookie') );
				}else{
					rets.message = "密码错误";
				}
					
			}else{
				rets.message = '找不到该用户';
			}
		}, 3);
		
	return rets;
});

MemberModule.extend('loginStatus', function( callback ){
	var rec,
		cookie = require('cookie'),
		id = cookie.get(blog.cookie + "_user", "id"),
		hashkey = cookie.get(blog.cookie + "_user", "hashkey"),
		hasdata = true,
		rets = { login: false };
	
	if ( !id || id.length === 0 || isNaN(id) ){
		hasdata = false;
	};
	
	if ( !hashkey || hashkey.length !== 40 ){
		hasdata = false;
	};
	
	if ( hasdata ){
		rec = new this.dbo.RecordSet(this.conn);
		rec
			.sql('Select * From blog_members Where id=' + id)
			.process(function(object){
				if ( !object.Bof && !object.Eof && object('member_hashkey').value === hashkey ){
					rets.login = true;
					typeof callback === 'function' && callback(rets, object);
				}
			});
	}
	
	return rets;
});

MemberModule.extend('adminStatus', function( callback ){
	var logs = this.loginStatus(function(rets, object){ rets.group = object('member_group').value; typeof callback === 'function' && callback(rets, object); });
	
	logs.admin = false;
	
	if ( logs.login ){
		var rec = new this.dbo.RecordSet(this.conn);
		rec
			.sql('Select * From blog_groups Where id=' + logs.group)
			.process(function(obj){
				if ( !obj.Bof && !obj.Eof ){
					var parses = JSON.parse(obj('group_code').value);
					logs.admin = parses.ControlSystem;
				}
			});
	}
	
	return logs;
});

return MemberModule;