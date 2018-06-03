var width = view.width;
		var height = view.height;
		console.log(view.height);
		var male = new Path.Circle({
			center : view.center + new Point(50,0),
			radius : 10,
			fillColor : 'red'
		});
		var secondmale = new Path.Circle({
			center : view.center + new Point(40,150),
			radius : 10,
			fillColor : 'blue'
		});
		var female = new Path.Circle({
			center : view.center + new Point(-50,0),
			radius : 10,
			fillColor : 'pink'
		});
		var currentscene;
		var scene1vars = {
			minapproach : 25,
			approachVelocity : new Point(1.5,0),
			chasespeed : 6
		}
		var scene2vars = {
			femalerepel : new Point(-1.5,0) * 2,
			pushimpulse : Point.random().normalize() * 3,
			seconds : 4,
			frameenddelay : 0
		}
		var scene3vars = {
			malecomeback : 0,
			femaleapproach : 0,
			framecount : 0
		}
		var scene4vars = {
			pushimpulse : 0,
			framecount : 0
		}
		var scene5vars = {
			approachspeed : 2,
			repelspeed : 4
		}
		function scene5(event) {
			console.log("In scene 5");
			var dist = male.position - secondmale.position;
			if(dist.length < 22) {
				male.position += dist.normalize() * scene5vars.repelspeed;
				secondmale.position -= dist.normalize() * scene5vars.repelspeed;
				male.position.angle += ((Math.random() * 2 - 1))/2;
				secondmale.position.angle += ((Math.random() * 2 - 1))/2;
			} else {
				male.position -= dist.normalize() * scene5vars.approachspeed;
				secondmale.position += dist.normalize() * scene5vars.approachspeed;
			}
		}
		function scene4(event) {
			console.log("In scene 4");
			scene4vars.framecount++;
			var x = secondmale.position.x + scene4vars.pushimpulse.x;
			var y = secondmale.position.y + scene4vars.pushimpulse.y;
			if (x < 12 || x > view.size.width - 12) {
				currentscene = scene5;
				//scene4vars.pushimpulse.x *= -1;
				//scene4vars.pushimpulse.angle += Math.random();
			}
			if (y < 12 || y > view.size.height - 12) {
				currentscene = scene5;
				//scene4vars.pushimpulse.y *= -1;
				//scene4vars.pushimpulse.angle += Math.random();
			}
			secondmale.position += scene4vars.pushimpulse;
			female.position -= scene3vars.femaleapproach;
		}
		function scene3(event) {
			console.log("In scene 3");
			scene3vars.framecount++;
			console.log(scene3vars.framecount);
			scene3vars.malecomeback = (secondmale.position - male.position).normalize();
			female.position += scene3vars.femaleapproach * 0.5;
			secondmale.position -= scene3vars.femaleapproach * 0.5;
			if(scene3vars.framecount > 18) {
				male.position += scene3vars.malecomeback * 5;
			}
			if ((male.position - secondmale.position).length < 20) {
				scene4vars.pushimpulse = scene3vars.malecomeback * 5;
				scene4vars.pushimpulse.angle += (Math.random() * 2 - 1) * 10;
				currentscene = scene4;
			}
		}
		function scene2(event) {
			scene2vars.frameenddelay++;
			console.log("In scene 2");
			console.log(scene2vars.frameenddelay);
			var x = male.position.x + scene2vars.pushimpulse.x;
			var y = male.position.y + scene2vars.pushimpulse.y;
			if (x < 12 || x > view.size.width - 12) {
				currentscene = scene3
				//scene2vars.pushimpulse.x *= -1;
				//scene2vars.pushimpulse.angle += Math.random();
			}
			if (y < 12 || y > view.size.height - 12) {
				currentscene = scene3
				//scene2vars.pushimpulse.y *= -1;
				//scene2vars.pushimpulse.angle += Math.random();
			}
			if(scene2vars.frameenddelay > 12) {
				female.position += scene2vars.femalerepel;
			}
			else {
				female.position += scene2vars.femalerepel/5;
			}
			male.position += scene2vars.pushimpulse;
			if (scene2vars.frameenddelay > 60) {
				currentscene = scene3;
			}
			scene3vars.malecomeback = (secondmale.position - male.position).normalize();
			scene3vars.femaleapproach = (secondmale.position - female.position).normalize();
		}
		function scene1(event) {
		    console.log("In scene 1");
			var dist = male.position - female.position;
			var separation = male.position - secondmale.position;
			if(dist.length > scene1vars.minapproach) {
				male.position -= scene1vars.approachVelocity;
				female.position += scene1vars.approachVelocity;
				separation = separation.normalize();
				separation *= scene1vars.chasespeed;
				secondmale.position += separation;
				console.log("Distance between male and female : " + dist.length);
				if((male.position - secondmale.position).length < 20) {
					scene2vars.pushimpulse = separation.normalize() * 5;
					scene2vars.pushimpulse.angle += (Math.random() * 2 - 1) * 10;
					currentscene = scene2;
				}
			} else {
				scene2vars.pushimpulse = separation.normalize() * 5;
				scene2vars.pushimpulse.angle += (Math.random() * 2 - 1) * 10;
				currentscene = scene2;
			}
		}
		currentscene = scene1;
		function onFrame(event) {
			currentscene(event);
		}