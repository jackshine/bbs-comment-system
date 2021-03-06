/**
 * Created by Administrator on 2016/11/22.
 * 控制器模块（控制器层）
 */
angular.module('bbs.controller',[])
	// 登录控制器
	.controller('loginController', ['$scope','loginService', function($scope,loginService) {
		
		// 登录方法
		$scope.login = function() {

			var promise = loginService.login($scope.username,$scope.userpwd);

			promise.success(function(data) {

				if (data == 1) {
					layer.msg('用户名不存在');
				} else if (data == 2) {
					layer.msg('密码错误');
				} else if (data == 3) {
					layer.msg('登录成功');
				}

			});

			promise.error(function() {
				layer.msg('网络连接请求失败！');
			});
		}

	}])
	// 发表评论画面控制器
	.controller('insertMsgController', ['$scope','msgService','$state', function($scope,msgService,$state) {

		// 数据模型
		$scope.data = {
			username:"",
			content:""
		}

		/**
			表单验证函数
		*/
		function checkForm() {

			// 验证用户名
			var usernameVal = $scope.data.username;

			if (usernameVal == '' || usernameVal.length > 10) {
				layer.msg('用户名不能为空且最多10个字符');
				return false;
			}

			// 验证内容
			var contentVal = $scope.data.content;

			if (contentVal == '' || contentVal.length > 600) {
				layer.msg('评论内容不能为空且最多600字');
				return false;
			}

			return true;
		}

		// 发表评论功能
		$scope.insertMsg = function() {

			// 调用表单验证
			if ( !checkForm() ) {
				return;
			}

			// 按钮loading状态
			$('#addBtn').button('loading');

			// 加载提示
			layer.load();

			// 调用业务功能
			var promise = msgService.insertMsg($scope.data);

			promise.success(function(data) {

				// 按钮完成状态
				$('#addBtn').button('complete');

				// 关闭加载提示
				layer.closeAll();

				layer.msg('发表评论成功！');

				// 自动跳转到查看评论画面
				setTimeout(function(){
					$state.go('QueryMsg');
				},300);
			});

			promise.error(function() {
				layer.msg('网络连接请求失败！');
			});

		}

	}])
	// 查看评论电脑版控制器
	.controller('queryMsgController', ['$scope','msgService', function($scope,msgService) {

		// 分页页码按钮
		$scope.pageBtns = [];
		// 修改模态层中的数据模型
		$scope.modal = {};

		/*
			分页加载数据功能
		*/
		function getData(pageNum) {

			// 加载提示
			layer.load(1);

			// 调用分页查询业务功能
			var promise = msgService.queryMsg(pageNum,20);

			promise.success(function(data) {

				// 分页信息
				$scope.pager = data.pager;
				// 数据集合
				$scope.data = data.list;

				//分页页码
				var start = $scope.pager.pageNum - 2;
				var end = $scope.pager.pageNum + 2;

				if ($scope.pager.pageNum <= 3) {
					start = 1;
					end = 5;
				}

				if ($scope.pager.pageNum >= $scope.pager.pageCount - 2) {
					end = $scope.pager.pageCount;
				}

				// 循环生成页码按钮
				$scope.pageBtns = [];

				for (var i = start;i <= end;i ++) {
					$scope.pageBtns.push(i);
				}

				// 关闭加载提示
				layer.closeAll();

				// 动画滚屏到评论顶部
				$('html,body').animate({scrollTop: $('#tRecordCount').offset().top}, 1000);
			});

			promise.error(function() {
				layer.closeAll();
				layer.msg('网络连接请求失败！');				
			});
		}

		// 初始化第一页的数据
		getData(1);

		// 分页功能
		$scope.queryByPage = function(pageNum) {			
			getData(pageNum);
		}

		// 点赞功能
		$scope.updateHit = function(index,id) {

			// 读取本地存储的点赞历史数据
			var hitIdsStr = sessionStorage.getItem('hitIds');

			var hitIds;//点赞历史记录的id数组

			// 如果是第一次存储，初始化空数组，如果以前有数据，把原来的数据转换为数组
			if (hitIdsStr == null) {
				hitIds = [];
			} else {
				hitIds = JSON.parse(hitIdsStr);
			}
						
			// 判断id是否在历史记录数组中存在
			if (hitIds.indexOf(id) != -1) {
				layer.msg('这条评论已经点过赞了！');
				return;
			}

			// 存储id到数组中
			hitIds.push(id);

			// 重新存储到本地存储
			sessionStorage.setItem('hitIds',JSON.stringify(hitIds));

			// 前端画面更新
			$scope.data[index].hit ++;

			// 更新后台数据
			msgService.updateHit(id)
				.success(function(){

				})
				.error(function() {
					layer.msg('网络请求失败！')
				});
		}

		// 删除评论功能
		$scope.deleteMsg = function(index,id,e) {

			if ( !confirm('确定要删除此评论吗?') ) {
				return;
			}

			// 按钮加载中状态
			$(e.target).button('loading');

			// 调用业务功能删除后台数据
			msgService.deleteMsg(id)
				.success(function(){
					// 前端删除
					$scope.data.splice(index,1);

					layer.msg('删除评论成功！');
				})
				.error(function(){
					layer.msg('网络请求失败');
				});			
		}

		// 显示修改数据模态层
		$scope.getMsg = function(index,id) {

			// 弹出模态层
			$('#myModal').modal();

			msgService.getMsg(id)
				.success(function(data){
					// 数据绑定
					$scope.modal.username = data.username;
					$scope.modal.content = data.content;
					$scope.modal.id = id;
					$scope.modal.index = index;
				})
				.error(function(){
					layer.msg('网络请求失败');
				});
		}

		// 修改评论数据功能
		$scope.updateMsg = function(e) {

			// 更新前端视图
			$scope.data[$scope.modal.index].username = $scope.modal.username;
			$scope.data[$scope.modal.index].content = $scope.modal.content;

			// 按钮加载中状态
			$(e.target).button('loading');

			// 后台更新
			msgService.updateMsg($scope.modal)
				.success(function(data){
					layer.msg('修改评论成功！');
					$(e.target).button('reset');
					$('#myModal').modal('hide');
				})
				.error(function(){
					layer.msg('网络请求失败');
				});
		}

	}])
	// 单独修改评论画面控制器
	.controller('updateMsgController', ['$scope','msgService','$stateParams', function($scope,msgService,$stateParams) {
		
		alert($stateParams.id);

	}])